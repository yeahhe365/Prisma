
import { ModelOption, ThinkingLevel, AppConfig } from './types';

export const MODELS: { value: ModelOption; label: string; desc: string }[] = [
  { 
    value: 'gemini-3-flash-preview', 
    label: 'Gemini 3 Flash', 
    desc: 'Low latency, high throughput, dynamic thinking.' 
  },
  { 
    value: 'gemini-3-pro-preview', 
    label: 'Gemini 3 Pro', 
    desc: 'Deep reasoning, complex tasks, higher intelligence.' 
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
  enableRecursiveLoop: false
};

export const getValidThinkingLevels = (model: ModelOption): ThinkingLevel[] => {
  if (model === 'gemini-3-pro-preview') {
    return ['low', 'high'];
  }
  return ['minimal', 'low', 'medium', 'high'];
};

export const getThinkingBudget = (level: ThinkingLevel, model: ModelOption): number => {
  const isPro = model === 'gemini-3-pro-preview';
  
  switch (level) {
    case 'minimal': return 0; // Disables thinking
    case 'low': return 2048;
    case 'medium': return 8192;
    case 'high': return isPro ? 32768 : 16384; 
    default: return 0;
  }
};
