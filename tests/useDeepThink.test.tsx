import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalysisResult, AppConfig, ChatMessage, ReviewResult } from '@/types';

const apiMocks = vi.hoisted(() => ({
  getAI: vi.fn(),
  getAIProvider: vi.fn(),
  findCustomModel: vi.fn(),
  resolveModelApiConfig: vi.fn(),
}));

const configMocks = vi.hoisted(() => ({
  getThinkingBudget: vi.fn(),
}));

const managerMocks = vi.hoisted(() => ({
  executeManagerAnalysis: vi.fn(),
  executeManagerReview: vi.fn(),
}));

const streamMocks = vi.hoisted(() => ({
  streamExpertResponse: vi.fn(),
  streamSynthesisResponse: vi.fn(),
}));

vi.mock('@/api', () => ({
  getAI: apiMocks.getAI,
  getAIProvider: apiMocks.getAIProvider,
  findCustomModel: apiMocks.findCustomModel,
  resolveModelApiConfig: apiMocks.resolveModelApiConfig,
}));

vi.mock('@/config', async () => {
  const actual = await vi.importActual<typeof import('@/config')>('@/config');
  return {
    ...actual,
    getThinkingBudget: configMocks.getThinkingBudget,
  };
});

vi.mock('@/services/deepThink/manager', () => ({
  executeManagerAnalysis: managerMocks.executeManagerAnalysis,
  executeManagerReview: managerMocks.executeManagerReview,
}));

vi.mock('@/services/deepThink/expert', () => ({
  streamExpertResponse: streamMocks.streamExpertResponse,
}));

vi.mock('@/services/deepThink/synthesis', () => ({
  streamSynthesisResponse: streamMocks.streamSynthesisResponse,
}));

import { DEFAULT_CONFIG } from '@/config';
import { useDeepThink } from '@/hooks/useDeepThink';

const aiClient = { chat: {} };

const baseHistory: ChatMessage[] = [
  { id: 'old-user', role: 'user', content: 'previous question' },
  { id: 'old-model', role: 'model', content: 'previous answer' },
  { id: 'current-user', role: 'user', content: 'current prompt', attachments: [] },
];

const baseConfig: AppConfig = {
  ...DEFAULT_CONFIG,
  customModels: [],
  expertConcurrency: 2,
};

const makeAnalysis = (experts: AnalysisResult['experts'] = []): AnalysisResult => ({
  thought_process: 'analysis complete',
  experts,
});

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('useDeepThink', () => {
  beforeEach(() => {
    apiMocks.getAI.mockReset().mockReturnValue(aiClient);
    apiMocks.getAIProvider.mockReset().mockReturnValue('google');
    apiMocks.findCustomModel.mockReset().mockReturnValue(undefined);
    apiMocks.resolveModelApiConfig.mockReset().mockReturnValue({ provider: 'google' });
    configMocks.getThinkingBudget.mockReset().mockReturnValue(100);
    managerMocks.executeManagerAnalysis.mockReset().mockResolvedValue(makeAnalysis());
    managerMocks.executeManagerReview
      .mockReset()
      .mockResolvedValue({ satisfied: true, critique: 'done' } satisfies ReviewResult);
    streamMocks.streamExpertResponse
      .mockReset()
      .mockImplementation(
        async (
          _ai,
          _model,
          expert,
          _context,
          _attachments,
          _budget,
          _thinkingLevel,
          _signal,
          onChunk,
        ) => {
          onChunk(`${expert.role} output`, `${expert.role} thought`);
        },
      );
    streamMocks.streamSynthesisResponse
      .mockReset()
      .mockImplementation(
        async (
          _ai,
          _model,
          _query,
          _history,
          _experts,
          _attachments,
          _budget,
          _thinkingLevel,
          _signal,
          onChunk,
        ) => {
          onChunk('final answer', 'final thought');
        },
      );
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  it('runs the full orchestration flow and completes with synthesized output', async () => {
    managerMocks.executeManagerAnalysis.mockResolvedValue(
      makeAnalysis([
        {
          role: 'Researcher',
          description: 'Researches',
          temperature: 0.2,
          prompt: 'research',
        },
      ]),
    );

    const { result } = renderHook(() => useDeepThink());

    await act(async () => {
      await result.current.runDynamicDeepThink(
        'current prompt',
        baseHistory,
        'gemini-3.5-flash',
        baseConfig,
      );
    });

    expect(apiMocks.getAI.mock.calls[0][0]).toStrictEqual({ provider: 'google' });
    expect(managerMocks.executeManagerAnalysis).toHaveBeenCalled();
    expect(streamMocks.streamExpertResponse).toHaveBeenCalledTimes(2);
    expect(streamMocks.streamSynthesisResponse).toHaveBeenCalledTimes(1);
    expect(result.current.appState).toBe('completed');
    expect(result.current.managerAnalysis).toEqual(
      expect.objectContaining({ thought_process: 'analysis complete' }),
    );
    expect(result.current.experts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'Primary Responder', status: 'completed' }),
        expect.objectContaining({ role: 'Researcher', status: 'completed' }),
      ]),
    );
    expect(result.current.finalOutput).toBe('final answer');
    expect(result.current.synthesisThoughts).toBe('final thought');
    expect(result.current.processStartTime).toBe(1000);
    expect(result.current.processEndTime).toBe(1000);
  });

  it('runs a review round and appends refined experts when recursive loop is enabled', async () => {
    managerMocks.executeManagerAnalysis.mockResolvedValue(
      makeAnalysis([
        {
          role: 'Researcher',
          description: 'Researches',
          temperature: 0.2,
          prompt: 'research',
        },
      ]),
    );
    managerMocks.executeManagerReview.mockResolvedValueOnce({
      satisfied: false,
      critique: 'need more detail',
      refined_experts: [
        {
          role: 'Critic',
          description: 'Critiques',
          temperature: 0.4,
          prompt: 'critique',
        },
      ],
    } satisfies ReviewResult);
    const { result } = renderHook(() => useDeepThink());

    await act(async () => {
      await result.current.runDynamicDeepThink('current prompt', baseHistory, 'gemini-3.5-flash', {
        ...baseConfig,
        enableRecursiveLoop: true,
      });
    });

    expect(managerMocks.executeManagerReview).toHaveBeenCalledTimes(1);
    expect(streamMocks.streamExpertResponse).toHaveBeenCalledTimes(3);
    expect(result.current.experts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'Primary Responder', round: 1 }),
        expect.objectContaining({ role: 'Researcher', round: 1 }),
        expect.objectContaining({ role: 'Critic', round: 2 }),
      ]),
    );
  });

  it('falls back to a synthesis error message when synthesis fails before emitting content', async () => {
    streamMocks.streamSynthesisResponse.mockRejectedValue(new Error('synthesis failed'));

    const { result } = renderHook(() => useDeepThink());

    await act(async () => {
      await result.current.runDynamicDeepThink(
        'current prompt',
        baseHistory,
        'gemini-3.5-flash',
        baseConfig,
      );
    });

    expect(result.current.appState).toBe('completed');
    expect(result.current.finalOutput).toContain('synthesis failed');
  });

  it('returns early when there is no query text and no attachments on the latest message', async () => {
    const { result } = renderHook(() => useDeepThink());
    const emptyHistory: ChatMessage[] = [
      { id: 'empty', role: 'user', content: '', attachments: [] },
    ];

    await act(async () => {
      await result.current.runDynamicDeepThink('', emptyHistory, 'gemini-3.5-flash', baseConfig);
    });

    expect(apiMocks.getAI).not.toHaveBeenCalled();
    expect(result.current.appState).toBe('idle');
  });

  it('captures expert failures without aborting the rest of the orchestration', async () => {
    managerMocks.executeManagerAnalysis.mockResolvedValue(
      makeAnalysis([
        {
          role: 'Fragile Expert',
          description: 'Sometimes fails',
          temperature: 0.2,
          prompt: 'fragile',
        },
      ]),
    );
    streamMocks.streamExpertResponse.mockImplementation(
      async (
        _ai,
        _model,
        expert,
        _context,
        _attachments,
        _budget,
        _thinkingLevel,
        _signal,
        onChunk,
      ) => {
        if (expert.role === 'Fragile Expert') {
          throw new Error('expert failed');
        }
        onChunk(`${expert.role} output`, `${expert.role} thought`);
      },
    );

    const { result } = renderHook(() => useDeepThink());

    await act(async () => {
      await result.current.runDynamicDeepThink(
        'current prompt',
        baseHistory,
        'gemini-3.5-flash',
        baseConfig,
      );
    });

    await waitFor(() => {
      expect(result.current.experts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: 'Fragile Expert', status: 'error' }),
        ]),
      );
    });
    expect(result.current.finalOutput).toBe('final answer');
  });

  it('falls back to the primary responder only when manager analysis rejects', async () => {
    managerMocks.executeManagerAnalysis.mockRejectedValue(new Error('manager exploded'));

    const { result } = renderHook(() => useDeepThink());

    await act(async () => {
      await result.current.runDynamicDeepThink(
        'current prompt',
        baseHistory,
        'gemini-3.5-flash',
        baseConfig,
      );
    });

    expect(result.current.managerAnalysis).toEqual(
      expect.objectContaining({
        thought_process: expect.stringContaining('manager exploded'),
        experts: [],
      }),
    );
    expect(result.current.experts).toEqual([
      expect.objectContaining({ role: 'Primary Responder', status: 'completed' }),
    ]);
  });

  it('continues to synthesis when the review round throws', async () => {
    managerMocks.executeManagerAnalysis.mockResolvedValue(
      makeAnalysis([
        {
          role: 'Researcher',
          description: 'Researches',
          temperature: 0.2,
          prompt: 'research',
        },
      ]),
    );
    managerMocks.executeManagerReview.mockRejectedValue(new Error('review failed'));

    const { result } = renderHook(() => useDeepThink());

    await act(async () => {
      await result.current.runDynamicDeepThink('current prompt', baseHistory, 'gemini-3.5-flash', {
        ...baseConfig,
        enableRecursiveLoop: true,
      });
    });

    expect(managerMocks.executeManagerReview).toHaveBeenCalledTimes(1);
    expect(streamMocks.streamSynthesisResponse).toHaveBeenCalledTimes(1);
    expect(result.current.finalOutput).toBe('final answer');
    expect(result.current.appState).toBe('completed');
  });

  it('resets back to idle when an unexpected top-level error escapes the main orchestration', async () => {
    managerMocks.executeManagerAnalysis.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeepThink());

    await act(async () => {
      await result.current.runDynamicDeepThink(
        'current prompt',
        baseHistory,
        'gemini-3.5-flash',
        baseConfig,
      );
    });

    expect(result.current.appState).toBe('idle');
    expect(result.current.processEndTime).toBe(1000);
  });

  it('resets back to idle when AI client initialization fails', async () => {
    apiMocks.getAI.mockImplementationOnce(() => {
      throw new Error('client exploded');
    });
    const { result } = renderHook(() => useDeepThink());
    let runError: unknown;

    await act(async () => {
      try {
        await result.current.runDynamicDeepThink(
          'current prompt',
          baseHistory,
          'gemini-3.5-flash',
          baseConfig,
        );
      } catch (error) {
        runError = error;
      }
    });

    expect(runError).toBeUndefined();
    expect(result.current.appState).toBe('idle');
    expect(result.current.processEndTime).toBe(1000);
  });

  it('keeps the newer abort controller when an older run finishes after being replaced', async () => {
    const firstManager = createDeferred<AnalysisResult>();
    const secondExpertStarted = createDeferred<void>();
    const secondExpertRelease = createDeferred<void>();
    let expertCallCount = 0;
    let secondSignal: AbortSignal | undefined;

    managerMocks.executeManagerAnalysis
      .mockReset()
      .mockImplementationOnce(() => firstManager.promise)
      .mockResolvedValue(makeAnalysis());

    streamMocks.streamExpertResponse
      .mockReset()
      .mockImplementation(
        async (
          _ai,
          _model,
          _expert,
          _context,
          _attachments,
          _budget,
          _thinkingLevel,
          signal: AbortSignal,
          onChunk,
        ) => {
          expertCallCount += 1;

          if (expertCallCount === 1) {
            if (!signal.aborted) {
              await new Promise<void>((resolve) => {
                signal.addEventListener('abort', () => resolve(), { once: true });
              });
            }
            return;
          }

          secondSignal = signal;
          secondExpertStarted.resolve();
          await secondExpertRelease.promise;
          onChunk('second output', 'second thought');
        },
      );

    const { result } = renderHook(() => useDeepThink());
    let firstRun!: Promise<void>;
    let secondRun!: Promise<void>;

    act(() => {
      firstRun = result.current.runDynamicDeepThink(
        'first prompt',
        baseHistory,
        'gemini-3.5-flash',
        baseConfig,
      );
    });

    await waitFor(() => {
      expect(streamMocks.streamExpertResponse).toHaveBeenCalledTimes(1);
    });

    act(() => {
      secondRun = result.current.runDynamicDeepThink(
        'second prompt',
        baseHistory,
        'gemini-3.5-flash',
        baseConfig,
      );
    });

    await secondExpertStarted.promise;

    await act(async () => {
      firstManager.resolve(makeAnalysis());
      await firstRun;
    });

    expect(secondSignal?.aborted).toBe(false);

    act(() => {
      result.current.stopDeepThink();
    });

    expect(secondSignal?.aborted).toBe(true);

    await act(async () => {
      secondExpertRelease.resolve();
      await secondRun;
    });
  });

  it('starts a fresh supplemental expert queue for a replacement run with the same concurrency', async () => {
    const oldExpertStarted = createDeferred<void>();
    const oldExpertRelease = createDeferred<void>();
    const newExpertStarted = createDeferred<void>();

    managerMocks.executeManagerAnalysis
      .mockReset()
      .mockResolvedValueOnce(
        makeAnalysis([
          {
            role: 'Old Expert A',
            description: 'Blocks the old queue',
            temperature: 0.2,
            prompt: 'old-a',
          },
          {
            role: 'Old Expert B',
            description: 'Would be queued behind old A',
            temperature: 0.2,
            prompt: 'old-b',
          },
        ]),
      )
      .mockResolvedValue(
        makeAnalysis([
          {
            role: 'New Expert',
            description: 'Must not wait for the old queue',
            temperature: 0.2,
            prompt: 'new',
          },
        ]),
      );

    streamMocks.streamExpertResponse
      .mockReset()
      .mockImplementation(
        async (
          _ai,
          _model,
          expert,
          _context,
          _attachments,
          _budget,
          _thinkingLevel,
          _signal,
          onChunk,
        ) => {
          if (expert.role === 'Old Expert A') {
            oldExpertStarted.resolve();
            await oldExpertRelease.promise;
            return;
          }

          if (expert.role === 'New Expert') {
            newExpertStarted.resolve();
          }

          onChunk(`${expert.role} output`, `${expert.role} thought`);
        },
      );

    const { result } = renderHook(() => useDeepThink());
    let firstRun!: Promise<void>;
    let secondRun!: Promise<void>;

    act(() => {
      firstRun = result.current.runDynamicDeepThink(
        'first prompt',
        baseHistory,
        'gemini-3.5-flash',
        { ...baseConfig, expertConcurrency: 1 },
      );
    });

    await oldExpertStarted.promise;

    act(() => {
      secondRun = result.current.runDynamicDeepThink(
        'second prompt',
        baseHistory,
        'gemini-3.5-flash',
        { ...baseConfig, expertConcurrency: 1 },
      );
    });

    await expect(
      Promise.race([newExpertStarted.promise.then(() => true), delay(200).then(() => false)]),
    ).resolves.toBe(true);

    await act(async () => {
      oldExpertRelease.resolve();
      await Promise.allSettled([firstRun, secondRun]);
    });
  });
});
