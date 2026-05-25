import type { ApiProvider } from '@/types';

export const PROVIDER_OPTIONS: { value: ApiProvider; label: string; shortLabel: string }[] = [
  { value: 'google', label: 'Gemini（v1beta）', shortLabel: 'Gemini' },
  { value: 'openai', label: 'OpenAI 兼容（v1）', shortLabel: 'OpenAI 兼容' },
];
