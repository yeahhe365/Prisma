import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CONFIG,
  DEFAULT_MODEL,
  getAllModels,
  getEffectiveConfig,
  getInitialSelectedModel,
  getProvider,
  getReasoningEffort,
  getThinkingBudget,
  getValidThinkingLevels,
  setModelPreference,
} from '../config';
import { resolveApiKey } from '../api';

describe('model bootstrap config', () => {
  it('defaults to the documented Gemini model when no cached selection exists', () => {
    expect(DEFAULT_MODEL).toBe('gemini-3-flash-preview');
    expect(getInitialSelectedModel(null)).toBe(DEFAULT_MODEL);
  });

  it('preserves a previously selected model', () => {
    expect(getInitialSelectedModel('glm-5-turbo')).toBe('glm-5-turbo');
  });
});

describe('api key resolution', () => {
  it('prefers an explicit key over environment fallbacks', () => {
    expect(
      resolveApiKey('explicit-key', {
        VITE_API_KEY: 'vite-key',
        GEMINI_API_KEY: 'gemini-key',
      }),
    ).toBe('explicit-key');
  });

  it('falls back from VITE_API_KEY to GEMINI_API_KEY', () => {
    expect(resolveApiKey(undefined, { VITE_API_KEY: 'vite-key' })).toBe('vite-key');
    expect(resolveApiKey(undefined, { GEMINI_API_KEY: 'gemini-key' })).toBe('gemini-key');
  });
});

describe('model preference helpers', () => {
  it('returns model-specific overrides without mutating unrelated defaults', () => {
    const config = setModelPreference(DEFAULT_CONFIG, 'glm-5-turbo', {
      planningLevel: 'low',
      enableRecursiveLoop: false,
    });

    expect(getEffectiveConfig('glm-5-turbo', config)).toMatchObject({
      planningLevel: 'low',
      enableRecursiveLoop: false,
      expertLevel: DEFAULT_CONFIG.expertLevel,
    });
    expect(getEffectiveConfig('gemini-3-flash-preview', config)).toMatchObject(DEFAULT_CONFIG);
  });

  it('removes empty per-model preference entries instead of storing undefined values', () => {
    const withPreference = setModelPreference(DEFAULT_CONFIG, 'glm-5-turbo', {
      planningLevel: 'low',
    });

    const cleaned = setModelPreference(withPreference, 'glm-5-turbo', {
      planningLevel: undefined,
    });

    expect(cleaned.modelPreferences).not.toHaveProperty('glm-5-turbo');
  });

  it('returns valid thinking levels based on the selected model family', () => {
    expect(getValidThinkingLevels('gemini-3.1-pro-preview')).toEqual(['low', 'medium', 'high']);
    expect(getValidThinkingLevels('o1-preview')).toEqual(['low', 'medium', 'high']);
    expect(getValidThinkingLevels('gemini-3-flash-preview')).toEqual([
      'minimal',
      'low',
      'medium',
      'high',
    ]);
  });

  it('maps thinking levels to Gemini token budgets and OpenAI reasoning effort', () => {
    expect(getThinkingBudget('high', 'gemini-3.1-pro-preview')).toBe(32768);
    expect(getThinkingBudget('medium', 'gemini-3-flash-preview')).toBe(8192);
    expect(getThinkingBudget('minimal', 'gemini-3-flash-preview')).toBe(0);
    expect(getReasoningEffort('minimal')).toBe('low');
    expect(getReasoningEffort('high')).toBe('high');
    expect(getReasoningEffort('unknown' as never)).toBeUndefined();
  });

  it('returns provider metadata and merges custom models into the selector list', () => {
    const allModels = getAllModels({
      ...DEFAULT_CONFIG,
      customModels: [
        {
          id: 'local-1',
          name: 'qwen-local',
          displayName: 'Qwen Local',
          provider: 'openai',
        },
      ],
    });

    expect(getProvider('custom')).toBe('openai');
    expect(allModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'gemini-3-flash-preview' }),
        expect.objectContaining({ value: 'qwen-local', label: 'Qwen Local', provider: 'openai' }),
      ]),
    );
  });
});
