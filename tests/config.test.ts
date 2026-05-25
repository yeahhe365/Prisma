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
  normalizeConfig,
  setModelPreference,
} from '@/config';
import { resolveApiKey } from '@/api';

describe('model bootstrap config', () => {
  it('starts without a default model when no user model exists', () => {
    expect(DEFAULT_MODEL).toBeNull();
    expect(getInitialSelectedModel(null)).toBe(DEFAULT_MODEL);
  });

  it('does not bundle custom models into new installs', () => {
    expect(DEFAULT_CONFIG.customModels).toEqual([]);
  });

  it('falls back to the first user model when a cached selection is no longer configured', () => {
    const config = {
      ...DEFAULT_CONFIG,
      customModels: [
        {
          id: 'custom-qwen',
          name: 'qwen-local',
          displayName: 'Qwen Local',
          provider: 'openai' as const,
        },
      ],
    };

    expect(getInitialSelectedModel('glm-5-turbo', config)).toBe('qwen-local');
  });

  it('preserves a previously selected custom model when it is still configured', () => {
    const config = {
      ...DEFAULT_CONFIG,
      customModels: [
        {
          id: 'custom-qwen',
          name: 'qwen-local',
          displayName: 'Qwen Local',
          provider: 'openai' as const,
        },
      ],
    };

    expect(getInitialSelectedModel('qwen-local', config)).toBe('qwen-local');
  });

  it('removes legacy bundled GLM models from persisted settings', () => {
    const config = normalizeConfig({
      ...DEFAULT_CONFIG,
      customModels: [
        {
          id: 'custom-glm-5-turbo',
          name: 'glm-5-turbo',
          displayName: 'GLM-5 Turbo',
          provider: 'openai',
        },
        {
          id: 'custom-glm-5-turbo-nothinking',
          name: 'glm-5-turbo-nothinking',
          displayName: 'GLM-5 Turbo Nothinking',
          provider: 'openai',
        },
      ],
      modelPreferences: {
        'glm-5-turbo': { planningLevel: 'low' },
      },
    });

    expect(config.customModels).toEqual([]);
    expect(config.modelPreferences).not.toHaveProperty('glm-5-turbo');
  });

  it('keeps user-customized models even when they share a legacy GLM name', () => {
    const config = normalizeConfig({
      ...DEFAULT_CONFIG,
      customModels: [
        {
          id: 'custom-glm-5-turbo',
          name: 'glm-5-turbo',
          displayName: 'GLM-5 Turbo',
          provider: 'openai',
          baseUrl: 'http://localhost:1234/v1',
        },
      ],
      modelPreferences: {
        'glm-5-turbo': { planningLevel: 'low' },
      },
    });

    expect(config.customModels).toEqual([
      expect.objectContaining({
        name: 'glm-5-turbo',
        baseUrl: 'http://localhost:1234/v1',
      }),
    ]);
    expect(config.modelPreferences).toHaveProperty('glm-5-turbo');
  });

  it('migrates legacy preset overrides into user-created models', () => {
    const config = normalizeConfig({
      ...DEFAULT_CONFIG,
      presetOverrides: [
        {
          id: 'override-gemini-3.5-flash',
          name: 'gemini-3.5-flash',
          provider: 'google',
          apiKey: 'gemini-key',
          baseUrl: 'https://gateway.example.com/v1beta',
        },
      ],
    });

    expect(config).not.toHaveProperty('presetOverrides');
    expect(config.customModels).toContainEqual(
      expect.objectContaining({
        name: 'gemini-3.5-flash',
        displayName: 'Gemini 3.5 Flash',
        provider: 'google',
        apiKey: 'gemini-key',
        baseUrl: 'https://gateway.example.com/v1beta',
      }),
    );
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

  it('does not fall back to environment keys when the model has no key', () => {
    expect(resolveApiKey(undefined, { VITE_API_KEY: 'vite-key' })).toBeUndefined();
    expect(resolveApiKey(undefined, { GEMINI_API_KEY: 'gemini-key' })).toBeUndefined();
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
    expect(getEffectiveConfig('qwen-local', config)).toMatchObject(DEFAULT_CONFIG);
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
    expect(getValidThinkingLevels('gemini-3.5-flash')).toEqual([
      'minimal',
      'low',
      'medium',
      'high',
    ]);
  });

  it('maps thinking levels to Gemini token budgets and OpenAI reasoning effort', () => {
    expect(getThinkingBudget('high', 'gemini-3.1-pro-preview')).toBe(32768);
    expect(getThinkingBudget('medium', 'gemini-3.5-flash')).toBe(8192);
    expect(getThinkingBudget('minimal', 'gemini-3.5-flash')).toBe(0);
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

    expect(getProvider('gemini-custom')).toBe('google');
    expect(getProvider('gpt-4o')).toBe('openai');
    expect(allModels).toEqual([
      expect.objectContaining({ value: 'qwen-local', label: 'Qwen Local', provider: 'openai' }),
    ]);
  });
});
