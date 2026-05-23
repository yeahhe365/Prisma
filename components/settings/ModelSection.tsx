import React, { useState } from 'react';
import { MODELS } from '../../config';
import { ApiProvider, AppConfig, CustomModel } from '../../types';
import AddModelForm from './AddModelForm';
import ModelListItem from './ModelListItem';
import { EditableModelItem } from './modelSettings';

interface ModelSectionProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
}

const getPresetOverrides = (config: AppConfig): Record<string, CustomModel> => {
  const overrides: Record<string, CustomModel> = {};
  (config.presetOverrides || []).forEach((model) => {
    overrides[model.name] = model;
  });
  return overrides;
};

const buildModelItems = (
  config: AppConfig,
  presetOverrides: Record<string, CustomModel>,
): EditableModelItem[] => {
  const presetItems = MODELS.filter((model) => model.value !== 'custom').map((model) => {
    const override = presetOverrides[model.value];

    return {
      id: `preset-${model.value}`,
      modelId: model.value,
      displayName: model.label,
      isPreset: true,
      provider: override?.provider ?? (model.provider as ApiProvider),
      apiKey: override?.apiKey,
      baseUrl: override?.baseUrl,
    };
  });

  const customItems = (config.customModels || []).map((model) => ({
    id: model.id,
    modelId: model.name,
    displayName: model.displayName || model.name,
    isPreset: false,
    provider: model.provider,
    apiKey: model.apiKey,
    baseUrl: model.baseUrl,
  }));

  return [...presetItems, ...customItems];
};

const ModelSection = ({ config, setConfig }: ModelSectionProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const customModels = config.customModels || [];
  const presetOverrides = getPresetOverrides(config);
  const allModels = buildModelItems(config, presetOverrides);

  const handleAddModel = (model: CustomModel) => {
    setConfig({ ...config, customModels: [...customModels, model] });
  };

  const handleDeleteCustomModel = (modelId: string) => {
    setConfig({ ...config, customModels: customModels.filter((model) => model.id !== modelId) });
    if (expandedId === modelId) setExpandedId(null);
  };

  const handleResetPreset = (presetValue: string) => {
    const overrides = (config.presetOverrides || []).filter(
      (override) => override.name !== presetValue,
    );
    setConfig({ ...config, presetOverrides: overrides });
  };

  const handleUpdateCustomModel = (modelId: string, updates: Partial<CustomModel>) => {
    setConfig({
      ...config,
      customModels: customModels.map((model) =>
        model.id === modelId ? { ...model, ...updates } : model,
      ),
    });
  };

  const handleUpdatePresetOverride = (presetValue: string, updates: Partial<CustomModel>) => {
    const overrides = (config.presetOverrides || []).filter(
      (override) => override.name !== presetValue,
    );
    const existing = presetOverrides[presetValue];

    overrides.push({
      ...(existing || {
        id: `override-${presetValue}`,
        name: presetValue,
        provider: 'google' as ApiProvider,
      }),
      ...updates,
    });

    setConfig({ ...config, presetOverrides: overrides });
  };

  const handleUpdate = (
    item: EditableModelItem,
    updates: { provider?: ApiProvider; apiKey?: string; baseUrl?: string },
  ) => {
    if (item.isPreset) {
      handleUpdatePresetOverride(item.modelId, updates);
    } else {
      handleUpdateCustomModel(item.id, updates);
    }
  };

  const handleUpdateDisplayName = (item: EditableModelItem, displayName: string) => {
    if (item.isPreset) return;
    handleUpdateCustomModel(item.id, { displayName });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] p-4">
        <div className="space-y-2">
          <div className="mb-3 text-xs font-medium text-[var(--theme-text-secondary)]">
            已添加模型 ({allModels.length})
          </div>

          {allModels.map((item) => {
            const isExpanded = expandedId === item.id;
            const isOverridden = Boolean(item.isPreset && presetOverrides[item.modelId]);

            return (
              <ModelListItem
                key={item.id}
                item={item}
                isExpanded={isExpanded}
                isOverridden={isOverridden}
                onToggle={() => setExpandedId(isExpanded ? null : item.id)}
                onDelete={() => handleDeleteCustomModel(item.id)}
                onReset={() => handleResetPreset(item.modelId)}
                onUpdate={(updates) => handleUpdate(item, updates)}
                onUpdateDisplayName={(displayName) => handleUpdateDisplayName(item, displayName)}
              />
            );
          })}
        </div>

        <AddModelForm existingModels={customModels} onAddModel={handleAddModel} />
      </div>
    </div>
  );
};

export default ModelSection;
