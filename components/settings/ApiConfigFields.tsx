import React from 'react';
import type { ApiProvider } from '@/types';
import ApiBaseUrlInput from '@/components/settings/ApiBaseUrlInput';
import ApiKeyInput from '@/components/settings/ApiKeyInput';
import ApiProviderControl from '@/components/settings/ApiProviderControl';

interface ApiConfigFieldsProps {
  idPrefix: string;
  provider: ApiProvider;
  apiKey?: string;
  baseUrl?: string;
  onUpdate: (updates: { provider?: ApiProvider; apiKey?: string; baseUrl?: string }) => void;
}

const API_KEY_PLACEHOLDER: Record<ApiProvider, string> = {
  google: 'AIza...',
  openai: 'sk-...',
};

const API_KEY_HELP: Record<ApiProvider, string> = {
  google: '支持粘贴一个或多行 Gemini API Key。',
  openai: '支持 OpenAI 兼容服务的 API Key；本地服务不需要密钥时可以留空。',
};

const ApiConfigFields = ({
  idPrefix,
  provider,
  apiKey,
  baseUrl,
  onUpdate,
}: ApiConfigFieldsProps) => (
  <div className="space-y-4">
    <ApiProviderControl
      value={provider}
      onChange={(nextProvider) => onUpdate({ provider: nextProvider })}
    />

    <ApiKeyInput
      id={`${idPrefix}-api-key`}
      value={apiKey}
      onChange={(nextApiKey) => onUpdate({ apiKey: nextApiKey })}
      placeholder={API_KEY_PLACEHOLDER[provider]}
      helpText={API_KEY_HELP[provider]}
    />

    <ApiBaseUrlInput
      id={`${idPrefix}-base-url`}
      provider={provider}
      value={baseUrl}
      onChange={(nextBaseUrl) => onUpdate({ baseUrl: nextBaseUrl })}
    />
  </div>
);

export default ApiConfigFields;
