
import { ModelOption, ThinkingLevel, AppConfig, ApiProvider } from './types';

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
  customBaseUrl: 'http://localhost:3000/v1',
  enableCustomApi: true,
  apiProvider: 'openai',
  customModels: [
    { name: 'glm-5-turbo', displayName: 'GLM-5 Turbo', provider: 'openai' },
    { name: 'glm-5-turbo-nothinking', displayName: 'GLM-5 Turbo Nothinking', provider: 'openai' },
  ],
  presetOverrides: [
    { id: 'override-gemini-3-flash-preview', name: 'gemini-3-flash-preview', provider: 'google', apiKey: '123456', baseUrl: 'http://localhost:7860/v1beta' },
    { id: 'override-gemini-3.1-pro-preview', name: 'gemini-3.1-pro-preview', provider: 'google', apiKey: '123456', baseUrl: 'http://localhost:7860/v1beta' },
  ],
  expertConcurrency: 3,
  enableRecursiveLoop: true,
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

export const getThinkingBudget = (level: ThinkingLevel, model: ModelOption): number => {
  const isGeminiPro = model === 'gemini-3.1-pro-preview';
  const isOpenAIReasoning = model === 'o1-preview' || model === 'o1-mini';

  switch (level) {
    case 'minimal': return 0;
    case 'low': return 2048;
    case 'medium': return 8192;
    case 'high':
      if (isOpenAIReasoning) return 65536;
      if (isGeminiPro) return 32768;
      return 16384;
    default: return 0;
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
