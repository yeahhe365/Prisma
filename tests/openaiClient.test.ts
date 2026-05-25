import { describe, expect, it, vi } from 'vitest';

import { generateContentStream } from '@/services/deepThink/openaiClient';
import type { OpenAIClient } from '@/types';

type DeltaChunk = {
  content?: string;
  reasoning_content?: string;
};

async function* streamChunks(chunks: DeltaChunk[]) {
  for (const delta of chunks) {
    yield { choices: [{ delta }] };
  }
}

const makeClient = (chunks: DeltaChunk[]) =>
  ({
    chat: {
      completions: {
        create: vi.fn(async () => streamChunks(chunks)),
      },
    },
  }) as unknown as OpenAIClient;

const collectStream = async (chunks: DeltaChunk[]) => {
  const client = makeClient(chunks);
  const collected: Array<{ text: string; thought?: string }> = [];

  for await (const chunk of generateContentStream(client, {
    model: 'glm-5-turbo',
    content: 'prompt',
    thinkingConfig: {
      includeThoughts: true,
      thinkingBudget: 100,
      thinkingLevel: 'medium',
    },
  })) {
    collected.push(chunk);
  }

  return collected;
};

describe('generateContentStream', () => {
  it('preserves visible text when thinking tags share a stream chunk with the answer', async () => {
    const chunks = await collectStream([
      { content: 'Intro <thinking>hidden plan</thinking>final answer' },
    ]);

    expect(chunks.map((chunk) => chunk.text).join('')).toBe('Intro final answer');
    expect(chunks.map((chunk) => chunk.thought || '').join('')).toBe('hidden plan');
  });

  it('handles thinking tags split across multiple stream chunks', async () => {
    const chunks = await collectStream([
      { content: 'Intro <thin' },
      { content: 'king>hidden ' },
      { content: 'plan</think' },
      { content: 'ing>final answer' },
    ]);

    expect(chunks.map((chunk) => chunk.text).join('')).toBe('Intro final answer');
    expect(chunks.map((chunk) => chunk.thought || '').join('')).toBe('hidden plan');
  });

  it('passes reasoning_content deltas through as thought text', async () => {
    const chunks = await collectStream([
      { reasoning_content: 'reasoning ', content: 'answer' },
      { reasoning_content: 'trace' },
    ]);

    expect(chunks.map((chunk) => chunk.text).join('')).toBe('answer');
    expect(chunks.map((chunk) => chunk.thought || '').join('')).toBe('reasoning trace');
  });
});
