import React from 'react';
import { Globe, Info, X } from 'lucide-react';
import type { ApiProvider } from '@/types';

interface ApiBaseUrlInputProps {
  id: string;
  provider: ApiProvider;
  value?: string;
  onChange: (value: string | undefined) => void;
}

const BASE_URL_PLACEHOLDERS: Record<ApiProvider, string> = {
  google: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1',
};

const HELP_TEXT: Record<ApiProvider, string> = {
  google: 'Gemini 可填写代理根地址或 v1beta 地址；直连官方 API 时可留空。',
  openai: 'OpenAI 兼容接口通常以 /v1 结尾，适用于 OpenAI、OpenRouter、Ollama、LM Studio 等。',
};

const ApiBaseUrlInput = ({ id, provider, value = '', onChange }: ApiBaseUrlInputProps) => {
  const placeholder = BASE_URL_PLACEHOLDERS[provider];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]"
        >
          <Globe size={13} />
          Base URL（选填）
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-[10px] font-medium text-[var(--theme-text-tertiary)] transition-colors hover:border-[var(--theme-border-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)]"
            title="清空 Base URL"
          >
            <X size={10} strokeWidth={1.5} />
            清空
          </button>
        )}
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="block w-full rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-3 font-mono text-sm text-[var(--theme-text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--theme-text-tertiary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20"
        placeholder={placeholder}
        spellCheck={false}
      />
      <p className="flex gap-1.5 text-xs leading-relaxed text-[var(--theme-text-tertiary)]">
        <Info size={14} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <span>{HELP_TEXT[provider]}</span>
      </p>
    </div>
  );
};

export default ApiBaseUrlInput;
