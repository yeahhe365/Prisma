import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanJsonString, fileToBase64 } from '@/utils';

describe('cleanJsonString', () => {
  beforeEach(() => {
    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;

      readAsDataURL(file: File) {
        if (file.name === 'broken.txt') {
          queueMicrotask(() => {
            this.onerror?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
          });
          return;
        }

        if (file.name === 'binary.dat') {
          this.result = new ArrayBuffer(8);
          queueMicrotask(() => {
            this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
          });
          return;
        }

        this.result = `data:${file.type};base64,ZmFrZS1kYXRh`;
        queueMicrotask(() => {
          this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
        });
      }
    }

    vi.stubGlobal('FileReader', MockFileReader);
  });

  it('returns an empty JSON object for empty input', () => {
    expect(cleanJsonString('')).toBe('{}');
  });

  it('extracts json from markdown code fences', () => {
    const input = 'Here is the result:\n```json\n{"ok":true}\n```';

    expect(cleanJsonString(input)).toBe('{"ok":true}');
  });

  it('extracts the first balanced json object from explanatory text', () => {
    const input = 'Thoughts first {"message":"hello","nested":{"value":1}} trailing text';

    expect(cleanJsonString(input)).toBe('{"message":"hello","nested":{"value":1}}');
  });

  it('returns an empty object string when no json is present', () => {
    expect(cleanJsonString('not json at all')).toBe('{}');
  });

  it('returns the original trimmed payload when it starts like json but never closes', () => {
    expect(cleanJsonString(' {"unfinished": true')).toBe(' {"unfinished": true');
  });

  it('keeps escaped quotes inside json strings while matching braces', () => {
    const input = 'prefix {"message":"hello \\"world\\"","nested":{"ok":true}} suffix';

    expect(cleanJsonString(input)).toBe('{"message":"hello \\"world\\"","nested":{"ok":true}}');
  });

  it('ignores braces inside quoted JSON strings while matching the object', () => {
    const input = 'Result: {"message":"literal { brace } and \\"quote\\"","ok":true} trailing';

    expect(cleanJsonString(input)).toBe(
      '{"message":"literal { brace } and \\"quote\\"","ok":true}',
    );
  });
});

describe('fileToBase64', () => {
  it('extracts the base64 payload from a data url', async () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    await expect(fileToBase64(file)).resolves.toBe('ZmFrZS1kYXRh');
  });

  it('rejects when the reader returns a non-string result', async () => {
    const file = new File(['binary'], 'binary.dat', { type: 'application/octet-stream' });

    await expect(fileToBase64(file)).rejects.toThrow('Failed to convert file to base64');
  });

  it('rejects when the reader errors', async () => {
    const file = new File(['oops'], 'broken.txt', { type: 'text/plain' });

    await expect(fileToBase64(file)).rejects.toBeTruthy();
  });
});
