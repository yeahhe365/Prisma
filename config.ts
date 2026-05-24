import type {
  ModelOption,
  ThinkingLevel,
  AppConfig,
  ApiProvider,
  ModelPreferences,
  ModelCatalogItem,
  CustomModel,
} from './types';

export const DEFAULT_MODEL: ModelOption | null = null;

export const MODELS: ModelCatalogItem[] = [];

export const STORAGE_KEYS = {
  SETTINGS: 'prisma-settings',
  MODEL: 'prisma-selected-model',
  SESSION_ID: 'prisma-active-session-id',
};

export const DEFAULT_CONFIG: AppConfig = {
  planningLevel: 'high',
  expertLevel: 'high',
  synthesisLevel: 'high',
  customModels: [],
  presetOverrides: [],
  expertConcurrency: 3,
  enableRecursiveLoop: true,
  modelPreferences: {},
};

const LEGACY_BUNDLED_CUSTOM_MODELS: CustomModel[] = [
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
];

const LEGACY_PRESET_MODEL_LABELS: Record<string, string> = {
  'gemini-3.5-flash': 'Gemini 3.5 Flash',
  'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash-Lite',
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isStoredCustomModel = (model: unknown): model is CustomModel => {
  return (
    isPlainObject(model) &&
    typeof model.id === 'string' &&
    typeof model.name === 'string' &&
    (model.provider === 'google' || model.provider === 'openai')
  );
};

const isLegacyBundledCustomModel = (model: CustomModel): boolean => {
  return LEGACY_BUNDLED_CUSTOM_MODELS.some((legacyModel) => {
    return (
      model.id === legacyModel.id &&
      model.name === legacyModel.name &&
      model.displayName === legacyModel.displayName &&
      model.provider === legacyModel.provider &&
      !model.apiKey &&
      !model.baseUrl
    );
  });
};

export const normalizeConfig = (rawConfig: unknown): AppConfig => {
  if (!isPlainObject(rawConfig)) return DEFAULT_CONFIG;

  const removedLegacyModelNames = new Set<string>();
  const customModels: CustomModel[] = Array.isArray(rawConfig.customModels)
    ? rawConfig.customModels.filter(isStoredCustomModel).filter((model) => {
        const shouldRemove = isLegacyBundledCustomModel(model);
        if (shouldRemove) removedLegacyModelNames.add(model.name);
        return !shouldRemove;
      })
    : [];

  const legacyPresetOverrides = Array.isArray(rawConfig.presetOverrides)
    ? rawConfig.presetOverrides.filter(isStoredCustomModel)
    : [];
  const migratedPresetModels = legacyPresetOverrides
    .filter((model) => !customModels.some((customModel) => customModel.name === model.name))
    .map((model) => ({
      ...model,
      id: model.id || `custom-${model.name}`,
      displayName: model.displayName || LEGACY_PRESET_MODEL_LABELS[model.name] || model.name,
    }));
  const userModels = [...customModels, ...migratedPresetModels];

  const modelPreferences = isPlainObject(rawConfig.modelPreferences)
    ? { ...(rawConfig.modelPreferences as Record<string, ModelPreferences>) }
    : { ...DEFAULT_CONFIG.modelPreferences };

  for (const removedModelName of removedLegacyModelNames) {
    if (!userModels.some((model) => model.name === removedModelName)) {
      delete modelPreferences[removedModelName];
    }
  }

  return {
    ...DEFAULT_CONFIG,
    ...rawConfig,
    customModels: userModels,
    presetOverrides: [],
    modelPreferences,
  };
};

export const getValidThinkingLevels = (model: ModelOption): ThinkingLevel[] => {
  const normalizedModel = model.toLowerCase();
  if (normalizedModel.includes('gemini') && normalizedModel.includes('pro')) {
    return ['low', 'medium', 'high'];
  }
  if (/^o[134]-/.test(normalizedModel)) {
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
  update: Partial<ModelPreferences>,
): AppConfig => {
  const existing = config.modelPreferences?.[model] || {};
  const newPrefs: ModelPreferences = { ...existing, ...update };
  // Remove undefined values to keep storage clean
  for (const key of Object.keys(newPrefs) as (keyof ModelPreferences)[]) {
    if (newPrefs[key] === undefined) delete newPrefs[key];
  }

  const modelPreferences = { ...config.modelPreferences };
  if (Object.keys(newPrefs).length > 0) {
    modelPreferences[model] = newPrefs;
  } else {
    delete modelPreferences[model];
  }

  return {
    ...config,
    modelPreferences,
  };
};

/**
 * Get thinking budget for Google Gemini models (controls thinking token allocation).
 * For OpenAI-compatible models, see getReasoningEffort() instead.
 */
export const getThinkingBudget = (level: ThinkingLevel, model: ModelOption): number => {
  const normalizedModel = model.toLowerCase();
  const isGeminiPro = normalizedModel.includes('gemini') && normalizedModel.includes('pro');

  switch (level) {
    case 'minimal':
      return 0;
    case 'low':
      return 2048;
    case 'medium':
      return 8192;
    case 'high':
      if (isGeminiPro) return 32768;
      return 16384;
    default:
      return 0;
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
    case 'minimal':
      return 'low';
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    default:
      return undefined;
  }
};

export const getProvider = (model: ModelOption): ApiProvider => {
  return model.toLowerCase().includes('gemini') ? 'google' : 'openai';
};

export const getAllModels = (config: AppConfig): ModelCatalogItem[] => {
  const customModels = (config.customModels || []).map((m) => ({
    value: m.name,
    label: m.displayName || m.name,
    desc: m.provider === 'google' ? 'Gemini API 模型' : 'OpenAI 兼容 API 模型',
    provider: m.provider,
  }));

  return customModels;
};

export const getInitialSelectedModel = (
  cachedModel: string | null,
  config: AppConfig = DEFAULT_CONFIG,
): ModelOption | null => {
  const model = cachedModel;
  if (model && getAllModels(config).some((item) => item.value === model)) return model;
  return getAllModels(config)[0]?.value ?? DEFAULT_MODEL;
};
