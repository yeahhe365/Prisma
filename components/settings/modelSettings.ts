import { ApiProvider } from '../../types';

export type EditableModelItem = {
  id: string;
  modelId: string;
  displayName: string;
  isPreset: boolean;
  provider: ApiProvider;
  apiKey?: string;
  baseUrl?: string;
};

export const PROVIDER_OPTIONS: { value: ApiProvider; label: string }[] = [
  { value: 'google', label: 'Gemini（v1beta）' },
  { value: 'openai', label: 'OpenAI 兼容（v1）' },
];
