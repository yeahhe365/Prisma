import React from 'react';
import type { ApiProvider } from '@/types';
import { PROVIDER_OPTIONS } from '@/components/settings/modelSettings';

interface ApiProviderControlProps {
  value: ApiProvider;
  onChange: (value: ApiProvider) => void;
  label?: string;
}

const ApiProviderControl = ({ value, onChange, label = 'API 模式' }: ApiProviderControlProps) => {
  const buttonClass = (isActive: boolean) =>
    `relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-secondary)] ${
      isActive
        ? 'bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] shadow-sm ring-1 ring-black/5 dark:ring-white/10'
        : 'text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-bg-tertiary)]/60 hover:text-[var(--theme-text-primary)]'
    }`;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
        {label}
      </div>
      <div
        role="group"
        aria-label={label}
        className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)]/35 p-1 shadow-sm"
      >
        {PROVIDER_OPTIONS.map((provider) => {
          const isActive = provider.value === value;

          return (
            <button
              key={provider.value}
              type="button"
              className={buttonClass(isActive)}
              aria-pressed={isActive}
              onClick={() => onChange(provider.value)}
            >
              {provider.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ApiProviderControl;
