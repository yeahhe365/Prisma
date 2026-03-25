import { ModelOption, ThinkingLevel, AppConfig, ApiProvider, ModelPreferences } from './types';

export const MODELS: { value: ModelOption; label: string; desc: string; provider: ApiProvider }[] = [
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    desc: '低延迟，高吞吐，动态思考。',
    provider: 'google'
  },
  {
    value: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    desc: '深度推理，复杂任务，更高智能。',
    provider: 'google'
  },
  {
    value: 'custom',
    label: '自定义模型',
    desc: '通过配置自定义基础 URL，使用任何 OpenAI 兼容 API（LM Studio、Ollama、LocalAI 等）。',
    provider: 'openai'
  },
];

export const STORAGE_KEYS = {
  SETTINGS: 'prisma-settings',
  MODEL: 'prisma-selected-model',
  SESSION_ID: 'prisma-active-session-id'
};

export const DEFAULT_CONFIG: AppConfig = {
  planningLevel: 'high',
  expertLevel: 'high',
  synthesisLevel: 'high',
  customApiKey: '',
  customBaseUrl: '',
  enableCustomApi: false,
  apiProvider: 'openai',
  customModels: [
    { id: 'custom-glm-5-turbo', name: 'glm-5-turbo', displayName: 'GLM-5 Turbo', provider: 'openai' },
    { id: 'custom-glm-5-turbo-nothinking', name: 'glm-5-turbo-nothinking', displayName: 'GLM-5 Turbo Nothinking', provider: 'openai' },
  ],
  presetOverrides: [],
  expertConcurrency: 3,
  enableRecursiveLoop: true,
  modelPreferences: {},
};

export const getValidThinkingLevels = (model: ModelOption): ThinkingLevel[] => {
  if (model === 'gemini-3.1-pro-preview') {
    return ['low', 'medium', 'high'];
  }
  if (model === 'o1-preview' || model === 'o1-mini') {
    return ['low', 'medium', 'high'];
  }
  return ['minimal', 'low', 'medium', 'high'];
};

/**
 * Resolve the effective config for a specific model.
 * Per-model preferences override global defaults.
 */
export const getEffectiveConfig = (model: ModelOption, config: AppConfig): AppConfig => {
  const prefs = config.modelPreferences?.[model];
  if (!prefs) return config;

  return {
    ...config,
    planningLevel: prefs.planningLevel ?? config.planningLevel,
    expertLevel: prefs.expertLevel ?? config.expertLevel,
    synthesisLevel: prefs.synthesisLevel ?? config.synthesisLevel,
    expertConcurrency: prefs.expertConcurrency ?? config.expertConcurrency,
    enableRecursiveLoop: prefs.enableRecursiveLoop ?? config.enableRecursiveLoop,
  };
};

/**
 * Update a per-model preference. Returns a new config object.
 */
export const setModelPreference = (
  config: AppConfig,
  model: string,
  update: Partial<ModelPreferences>
): AppConfig => {
  const existing = config.modelPreferences?.[model] || {};
  const newPrefs: ModelPreferences = { ...existing, ...update };
  // Remove undefined values to keep storage clean
  for (const key of Object.keys(newPrefs) as (keyof ModelPreferences)[]) {
    if (newPrefs[key] === undefined) delete newPrefs[key];
  }

  return {
    ...config,
    modelPreferences: {
      ...config.modelPreferences,
      [model]: Object.keys(newPrefs).length > 0 ? newPrefs : undefined,
    },
  };
};

/**
 * Get thinking budget for Google Gemini models (controls thinking token allocation).
 * For OpenAI-compatible models, see getReasoningEffort() instead.
 */
export const getThinkingBudget = (level: ThinkingLevel, model: ModelOption): number => {
  const isGeminiPro = model === 'gemini-3.1-pro-preview';

  switch (level) {
    case 'minimal': return 0;
    case 'low': return 2048;
    case 'medium': return 8192;
    case 'high':
      if (isGeminiPro) return 32768;
      return 16384;
    default: return 0;
  }
};

/**
 * Map thinking level to OpenAI reasoning_effort parameter.
 * Supported by: o1/o3/o4-mini series.
 * Other OpenAI-compatible models (GLM, DeepSeek) handle thinking server-side
 * and don't support this parameter — they return reasoning_content passively.
 */
export const getReasoningEffort = (level: ThinkingLevel): string | undefined => {
  switch (level) {
    case 'minimal': return 'low';
    case 'low': return 'low';
    case 'medium': return 'medium';
    case 'high': return 'high';
    default: return undefined;
  }
};

export const getProvider = (model: ModelOption): ApiProvider => {
  const modelInfo = MODELS.find(m => m.value === model);
  return modelInfo?.provider || 'google';
};

export const getAllModels = (config: AppConfig): { value: ModelOption; label: string; desc: string; provider: ApiProvider }[] => {
  const presetModels = MODELS.filter(m => m.value !== 'custom');

  const customModels = (config.customModels || []).map(m => ({
    value: m.name as ModelOption,
    label: m.displayName || m.name,
    desc: `自定义 ${m.provider} 模型`,
    provider: m.provider
  }));

  return [...presetModels, ...customModels];
};
