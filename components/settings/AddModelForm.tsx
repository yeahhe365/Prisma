import React, { useState } from 'react';
import { Bot, Globe, Key, Plus, Tag } from 'lucide-react';
import { ApiProvider, CustomModel } from '../../types';
import { PROVIDER_OPTIONS } from './modelSettings';

interface AddModelFormProps {
  existingModels: CustomModel[];
  onAddModel: (model: CustomModel) => void;
}

const AddModelForm = ({ existingModels, onAddModel }: AddModelFormProps) => {
  const [modelName, setModelName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [provider, setProvider] = useState<ApiProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelNameError, setModelNameError] = useState('');
  const inputClass =
    'block w-full rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-2.5 text-sm text-[var(--theme-text-primary)] outline-none placeholder:text-[var(--theme-text-tertiary)] transition-colors focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20';
  const labelClass = 'flex items-center gap-2 text-sm font-medium text-[var(--theme-text-secondary)]';

  const handleAddModel = () => {
    const trimmedName = modelName.trim();
    if (!trimmedName) return;

    if (existingModels.find((model) => model.name === trimmedName)) {
      setModelNameError(`Model ID "${trimmedName}" 已存在。`);
      return;
    }

    onAddModel({
      id: `custom-${Date.now()}`,
      name: trimmedName,
      displayName: displayName.trim() || trimmedName,
      provider,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
    });

    setModelName('');
    setDisplayName('');
    setApiKey('');
    setBaseUrl('');
    setModelNameError('');
  };

  return (
    <div className="border-t border-[var(--theme-border-primary)] pt-4">
      <div className="mb-3 text-xs font-medium text-[var(--theme-text-secondary)]">添加新模型</div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <label className={labelClass}>
              <Bot size={14} className="text-[var(--theme-text-tertiary)]" />
              Model ID（必填）
            </label>
            <input
              type="text"
              placeholder="例如：llama-3-8b-instruct"
              value={modelName}
              aria-invalid={Boolean(modelNameError)}
              aria-describedby={modelNameError ? 'new-model-name-error' : undefined}
              onChange={(e) => {
                setModelName(e.target.value);
                if (modelNameError) setModelNameError('');
              }}
              className={inputClass}
            />
            {modelNameError && (
              <p id="new-model-name-error" role="alert" className="text-xs text-[var(--theme-text-danger)]">
                {modelNameError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClass}>
              <Tag size={14} className="text-[var(--theme-text-tertiary)]" />
              Display Name（选填）
            </label>
            <input
              type="text"
              placeholder="例如：Llama 3 (8B)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--theme-text-secondary)]">API 类型</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as ApiProvider)}
            className={inputClass}
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>
            <Key size={14} className="text-[var(--theme-text-tertiary)]" />
            API Key（选填）
          </label>
          <input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>
            <Globe size={14} className="text-[var(--theme-text-tertiary)]" />
            Base URL（选填）
          </label>
          <input
            type="text"
            placeholder="https://api.example.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          onClick={handleAddModel}
          disabled={!modelName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-bg-accent)] px-4 py-2 text-sm font-medium text-[var(--theme-text-accent)] shadow-sm transition-all hover:bg-[var(--theme-bg-accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--theme-bg-tertiary)] disabled:text-[var(--theme-text-tertiary)]"
        >
          <Plus size={16} />
          添加模型
        </button>
      </div>
    </div>
  );
};

export default AddModelForm;
