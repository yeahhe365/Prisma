import { describe, expect, it } from 'vitest';

import { cleanJsonString } from './utils';

describe('cleanJsonString', () => {
  it('returns an empty JSON object for empty input', () => {
    expect(cleanJsonString('')).toBe('{}');
  });

  it('extracts JSON from a markdown code block', () => {
    const input = [
      'Here is the plan:',
      '```json',
      '{"thought_process":"split the problem","experts":[]}',
      '```',
    ].join('\n');

    expect(cleanJsonString(input)).toBe('{"thought_process":"split the problem","experts":[]}');
  });

  it('extracts the first balanced JSON object from surrounding text', () => {
    const input = 'Before {"satisfied":false,"critique":"needs more detail"} after';

    expect(cleanJsonString(input)).toBe('{"satisfied":false,"critique":"needs more detail"}');
  });

  it('ignores braces inside quoted JSON strings while matching the object', () => {
    const input = 'Result: {"message":"literal { brace } and \\"quote\\"","ok":true} trailing';

    expect(cleanJsonString(input)).toBe('{"message":"literal { brace } and \\"quote\\"","ok":true}');
  });
});
