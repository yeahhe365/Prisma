import { describe, expect, it, vi } from 'vitest';

import { RequestQueue, withRetry } from '@/services/utils/retry';

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('withRetry', () => {
  it('retries transient failures until the operation succeeds', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ status: 500 })
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue('ok');

    const resultPromise = withRetry(operation, 3, 100);

    await expect(resultPromise).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
  }, 1000);

  it('stops retrying when the abort signal is triggered', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const controller = new AbortController();
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue({ status: 500 });
    const resultPromise = withRetry(operation, 3, 1000, controller.signal);

    await Promise.resolve();
    controller.abort();

    await expect(resultPromise).rejects.toMatchObject({ name: 'AbortError' });
  }, 1000);

  it('does not retry non-transient client errors', async () => {
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue({ status: 400 });

    await expect(withRetry(operation, 3, 10)).rejects.toMatchObject({ status: 400 });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('respects Retry-After headers from the top-level error shape', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({
        status: 429,
        headers: { get: (name: string) => (name === 'retry-after' ? '0.01' : null) },
      })
      .mockResolvedValue('ok');

    const resultPromise = withRetry(operation, 2, 1000);
    await vi.advanceTimersByTimeAsync(10);

    await expect(resultPromise).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('respects date-based Retry-After headers from nested response objects', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-20T00:00:00.000Z'));

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({
        response: {
          status: 503,
          headers: {
            get: (name: string) =>
              name === 'retry-after' ? 'Mon, 20 Apr 2026 00:00:01 GMT' : null,
          },
        },
      })
      .mockResolvedValue('ok');

    const resultPromise = withRetry(operation, 2, 1000);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(resultPromise).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  }, 1000);
});

describe('RequestQueue', () => {
  it('respects the configured concurrency limit', async () => {
    const queue = new RequestQueue(2);
    const taskA = deferred<string>();
    const taskB = deferred<string>();
    const taskC = deferred<string>();
    const started: string[] = [];

    const makeTask = (label: string, blocker: Promise<string>) => async () => {
      started.push(label);
      return blocker;
    };

    const promiseA = queue.add(makeTask('A', taskA.promise));
    const promiseB = queue.add(makeTask('B', taskB.promise));
    const promiseC = queue.add(makeTask('C', taskC.promise));

    await Promise.resolve();
    expect(started).toEqual(['A', 'B']);

    taskA.resolve('done-a');
    await Promise.resolve();
    await Promise.resolve();
    await promiseA;

    expect(started).toEqual(['A', 'B', 'C']);

    taskB.resolve('done-b');
    taskC.resolve('done-c');

    await expect(Promise.all([promiseA, promiseB, promiseC])).resolves.toEqual([
      'done-a',
      'done-b',
      'done-c',
    ]);
  }, 1000);

  it('propagates task rejections to callers', async () => {
    const queue = new RequestQueue(1);

    await expect(
      queue.add(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
