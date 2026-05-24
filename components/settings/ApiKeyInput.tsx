import React, { useState } from 'react';
import { Check, Info } from 'lucide-react';

interface ApiKeyInputProps {
  id: string;
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  helpText?: string;
}

const ApiKeyInput = ({
  id,
  label = 'API Key（选填）',
  value = '',
  onChange,
  placeholder = 'sk-...',
  helpText = '为这个模型保存专用 API Key。',
}: ApiKeyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const apiKeyBlurClass =
    !isFocused && hasValue
      ? 'text-transparent [text-shadow:0_0_6px_var(--theme-text-primary)] tracking-widest'
      : '';

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]"
      >
        {label}
      </label>
      <div className="relative">
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value || undefined)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`block min-h-[80px] w-full resize-y rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-3 font-mono text-sm text-[var(--theme-text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--theme-text-tertiary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20 ${apiKeyBlurClass}`}
          placeholder={placeholder}
          spellCheck={false}
        />
        {!isFocused && hasValue && (
          <div className="pointer-events-none absolute right-3 top-3">
            <Check size={16} className="text-[var(--theme-text-success)]" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <p className="flex gap-1.5 text-xs leading-relaxed text-[var(--theme-text-tertiary)]">
        <Info size={14} className="mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <span>{helpText}</span>
      </p>
    </div>
  );
};

export default ApiKeyInput;
