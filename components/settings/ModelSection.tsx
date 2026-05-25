import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Check, CirclePlus, KeyRound, Trash2, X } from 'lucide-react';
import type { ApiProvider, AppConfig, CustomModel, ModelCatalogItem } from '@/types';
import { getModelIcon } from '@/components/ModelIcon';
import ApiConfigFields from '@/components/settings/ApiConfigFields';

interface ModelSectionProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
}

type ModelEditorItem = {
  id: string;
  modelId: string;
  displayName: string;
  provider: ApiProvider;
  apiKey?: string;
  baseUrl?: string;
};

type ModelDraft = {
  modelId: string;
  displayName: string;
  provider: ApiProvider;
  apiKey: string;
  baseUrl: string;
};

const NEW_MODEL_ID = 'new-custom-model';

const emptyDraft: ModelDraft = {
  modelId: '',
  displayName: '',
  provider: 'openai',
  apiKey: '',
  baseUrl: '',
};

const providerLabels: Record<ApiProvider, string> = {
  google: 'Gemini',
  openai: 'OpenAI 兼容',
};

const inputClass =
  'block w-full rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-3 text-sm text-[var(--theme-text-primary)] outline-none placeholder:text-[var(--theme-text-tertiary)] transition-colors focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20';

const labelClass =
  'text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]';

const panelClass =
  'overflow-hidden rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)]/30';

const buildModelItems = (config: AppConfig): ModelEditorItem[] =>
  (config.customModels || []).map((model) => ({
    id: model.id,
    modelId: model.name,
    displayName: model.displayName || model.name,
    provider: model.provider,
    apiKey: model.apiKey,
    baseUrl: model.baseUrl,
  }));

const toDraft = (item: ModelEditorItem): ModelDraft => ({
  modelId: item.modelId,
  displayName: item.displayName,
  provider: item.provider,
  apiKey: item.apiKey || '',
  baseUrl: item.baseUrl || '',
});

const toIconModel = (item: ModelEditorItem): ModelCatalogItem => ({
  value: item.modelId,
  label: item.displayName,
  desc: '',
  provider: item.provider,
});

const trimOptional = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

const CurrentPill = () => (
  <span className="flex items-center gap-1.5 rounded-full bg-[var(--theme-bg-accent)] px-2.5 py-1 text-[10px] font-bold text-[var(--theme-text-accent)] shadow-sm">
    <Check size={11} strokeWidth={3} />
    当前
  </span>
);

const ProviderPill = ({ provider }: { provider: ApiProvider }) => (
  <span className="inline-flex shrink-0 items-center rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-text-tertiary)]">
    {providerLabels[provider]}
  </span>
);

const ModelSection = ({ config, setConfig }: ModelSectionProps) => {
  const customModels = config.customModels || [];
  const modelItems = useMemo(() => buildModelItems(config), [config]);

  const [selectedId, setSelectedId] = useState<string>(() => modelItems[0]?.id || NEW_MODEL_ID);
  const selectedItem = modelItems.find((item) => item.id === selectedId);
  const isCreating = selectedId === NEW_MODEL_ID;
  const [draft, setDraft] = useState<ModelDraft>(() =>
    selectedItem ? toDraft(selectedItem) : emptyDraft,
  );
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (isCreating) return;
    if (!selectedItem) {
      setSelectedId(modelItems[0]?.id || NEW_MODEL_ID);
    }
  }, [isCreating, modelItems, selectedItem]);

  useEffect(() => {
    setValidationMessage('');
    setDraft(isCreating || !selectedItem ? emptyDraft : toDraft(selectedItem));
  }, [isCreating, selectedId, selectedItem]);

  const googleItems = modelItems.filter((item) => item.provider === 'google');
  const openaiItems = modelItems.filter((item) => item.provider === 'openai');

  const updateDraft = (updates: Partial<ModelDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
    setValidationMessage('');
  };

  const handleApiConfigUpdate = (updates: {
    provider?: ApiProvider;
    apiKey?: string;
    baseUrl?: string;
  }) => {
    updateDraft({
      ...(updates.provider ? { provider: updates.provider } : {}),
      ...('apiKey' in updates ? { apiKey: updates.apiKey || '' } : {}),
      ...('baseUrl' in updates ? { baseUrl: updates.baseUrl || '' } : {}),
    });
  };

  const validateDraft = (currentItem?: ModelEditorItem): string | null => {
    const modelId = draft.modelId.trim();
    if (!modelId) return 'Model ID 不能为空。';

    const reservedIds = new Set<string>();
    customModels.forEach((model) => {
      if (!currentItem || model.id !== currentItem.id) {
        reservedIds.add(model.name);
      }
    });

    if (reservedIds.has(modelId)) return `Model ID "${modelId}" 已存在。`;
    return null;
  };

  const handleSave = () => {
    const error = validateDraft(selectedItem);
    if (error) {
      setValidationMessage(error);
      return;
    }

    const modelId = draft.modelId.trim();
    const nextModel: CustomModel = {
      id: selectedItem?.id || `custom-${Date.now()}`,
      name: modelId,
      displayName: draft.displayName.trim() || modelId,
      provider: draft.provider,
      apiKey: trimOptional(draft.apiKey),
      baseUrl: trimOptional(draft.baseUrl),
    };

    if (isCreating) {
      setConfig({ ...config, customModels: [...customModels, nextModel] });
      setSelectedId(nextModel.id);
      return;
    }

    if (!selectedItem) return;

    const nextConfig: AppConfig = {
      ...config,
      customModels: customModels.map((model) =>
        model.id === selectedItem.id ? { ...model, ...nextModel } : model,
      ),
    };

    if (selectedItem.modelId !== modelId && config.modelPreferences?.[selectedItem.modelId]) {
      const modelPreferences = { ...config.modelPreferences };
      modelPreferences[modelId] = modelPreferences[selectedItem.modelId];
      delete modelPreferences[selectedItem.modelId];
      nextConfig.modelPreferences = modelPreferences;
    }

    setConfig(nextConfig);
  };

  const handleCancelDraft = () => {
    setValidationMessage('');

    if (isCreating || !selectedItem) {
      setDraft(emptyDraft);
      return;
    }

    setDraft(toDraft(selectedItem));
  };

  const handleDeleteCustomModel = () => {
    if (!selectedItem) return;

    const nextCustomModels = customModels.filter((model) => model.id !== selectedItem.id);
    const nextModelPreferences = { ...(config.modelPreferences || {}) };
    delete nextModelPreferences[selectedItem.modelId];

    setConfig({
      ...config,
      customModels: nextCustomModels,
      modelPreferences: nextModelPreferences,
    });
    setSelectedId(nextCustomModels[0]?.id || NEW_MODEL_ID);
  };

  const handleAddModel = () => {
    setSelectedId(NEW_MODEL_ID);
  };

  const renderModelButton = (item: ModelEditorItem) => {
    const isSelected = item.id === selectedId;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setSelectedId(item.id)}
        aria-pressed={isSelected}
        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
          isSelected
            ? 'border-[var(--theme-border-focus)] bg-[var(--theme-bg-accent)]/10 text-[var(--theme-text-primary)]'
            : 'border-transparent text-[var(--theme-text-secondary)] hover:border-[var(--theme-border-secondary)] hover:bg-[var(--theme-bg-tertiary)]/50 hover:text-[var(--theme-text-primary)]'
        }`}
      >
        <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-[var(--theme-text-link)]' : ''}`}>
          {getModelIcon(toIconModel(item))}
        </div>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`truncate font-medium ${
                isSelected ? 'text-[var(--theme-text-link)]' : ''
              }`}
            >
              {item.displayName}
            </span>
          </span>
          <span className="mt-1 block truncate font-mono text-[10px] text-[var(--theme-text-tertiary)] opacity-80">
            {item.modelId}
          </span>
        </span>
        <span className="ml-2 shrink-0">{isSelected && <CurrentPill />}</span>
      </button>
    );
  };

  const renderProviderGroup = (label: string, items: ModelEditorItem[], emptyText: string) => (
    <div className="space-y-1">
      <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-tertiary)]">
        {label}
      </div>
      {items.length > 0 ? (
        items.map(renderModelButton)
      ) : (
        <div className="px-3 py-4 text-center text-xs italic text-[var(--theme-text-tertiary)]">
          {emptyText}
        </div>
      )}
    </div>
  );

  const selectedTitle = isCreating ? '添加模型' : selectedItem?.displayName || '模型配置';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
            <Bot size={14} strokeWidth={1.5} />
            管理模型
          </h3>
          <button
            type="button"
            onClick={handleAddModel}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--theme-text-link)] transition-colors hover:bg-[var(--theme-bg-tertiary)]"
          >
            <CirclePlus size={13} />
            添加
          </button>
        </div>

        <div className={panelClass} data-testid="settings-model-list-container">
          <div className="max-h-[280px] space-y-2 overflow-y-auto p-1.5 custom-scrollbar">
            {renderProviderGroup('Gemini', googleItems, '暂无 Gemini 模型')}
            {renderProviderGroup('OpenAI 兼容', openaiItems, '暂无 OpenAI 兼容模型')}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)]/30 px-3 py-2 text-xs text-[var(--theme-text-tertiary)]">
            <span>已添加模型 ({modelItems.length})</span>
            <span>
              Gemini {googleItems.length} / OpenAI 兼容 {openaiItems.length}
            </span>
          </div>
        </div>
      </section>

      <section className={`${panelClass} animate-in fade-in slide-in-from-top-2 duration-200`}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--theme-border-secondary)] px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--theme-text-primary)]">
              {selectedTitle}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <ProviderPill provider={draft.provider} />
              {!isCreating && selectedItem && <span className={labelClass}>已保存</span>}
            </div>
          </div>

          {selectedItem && !isCreating && (
            <button
              type="button"
              onClick={handleDeleteCustomModel}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-[var(--theme-text-danger)] transition-colors hover:bg-[var(--theme-bg-danger)]/10"
              title="删除模型"
            >
              <Trash2 size={14} />
              删除
            </button>
          )}
        </div>

        <div className="space-y-5 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="model-editor-id" className={labelClass}>
                Model ID
              </label>
              <input
                id="model-editor-id"
                type="text"
                value={draft.modelId}
                onChange={(event) => updateDraft({ modelId: event.target.value })}
                className={inputClass}
                placeholder={
                  draft.provider === 'google' ? '例如：gemini-2.5-flash' : '例如：gpt-4o'
                }
                aria-invalid={Boolean(validationMessage)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="model-editor-display-name" className={labelClass}>
                显示名称
              </label>
              <input
                id="model-editor-display-name"
                type="text"
                value={draft.displayName}
                onChange={(event) => updateDraft({ displayName: event.target.value })}
                className={inputClass}
                placeholder={draft.modelId || '例如：主力模型'}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
              <KeyRound size={14} strokeWidth={1.5} />
              API 配置
            </h4>
            <ApiConfigFields
              idPrefix={`model-editor-${selectedItem?.id || 'new'}`}
              provider={draft.provider}
              apiKey={draft.apiKey}
              baseUrl={draft.baseUrl}
              onUpdate={handleApiConfigUpdate}
            />
          </div>

          {validationMessage && (
            <p
              role="alert"
              className="rounded-lg border border-[var(--theme-bg-danger)]/30 bg-[var(--theme-bg-error-message)] px-3 py-2 text-sm text-[var(--theme-text-danger)]"
            >
              {validationMessage}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)]/30 p-3">
          <button
            type="button"
            onClick={handleCancelDraft}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)]"
          >
            <X size={14} />
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded bg-[var(--theme-bg-accent)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-accent)] shadow-sm transition-colors hover:bg-[var(--theme-bg-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
          >
            <Check size={14} />
            {isCreating ? '添加模型' : '保存配置'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ModelSection;
