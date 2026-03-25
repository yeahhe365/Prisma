import React, { useState } from 'react';
import { Plus, Trash2, Bot, Key, Globe, ChevronDown, ChevronUp, Tag, RotateCcw, Lock } from 'lucide-react';
import { AppConfig, ApiProvider, CustomModel } from '../../types';
import { MODELS } from '../../config';

interface ModelSectionProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
}

// Build the unified model list: presets first, then customs
const getPresetOverrides = (config: AppConfig): Record<string, CustomModel> => {
  const map: Record<string, CustomModel> = {};
  (config.presetOverrides || []).forEach(m => { map[m.name] = m; });
  return map;
};

const PROVIDER_OPTIONS: { value: ApiProvider; label: string }[] = [
  { value: 'google', label: 'Gemini（v1beta）' },
  { value: 'openai', label: 'OpenAI 兼容（v1）' },
];

const ModelSection = ({ config, setConfig }: ModelSectionProps) => {
  const [newModelName, setNewModelName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newModelProvider, setNewModelProvider] = useState<ApiProvider>('openai');
  const [newModelApiKey, setNewModelApiKey] = useState('');
  const [newModelBaseUrl, setNewModelBaseUrl] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const customModels = config.customModels || [];
  const presetOverrides = getPresetOverrides(config);
  const presets = MODELS.filter(m => m.value !== 'custom');

  // All models in one list
  const allModels = [
    ...presets.map(p => {
      const override = presetOverrides[p.value];
      return {
        id: `preset-${p.value}`,
        modelId: p.value,
        displayName: p.label,
        description: p.desc,
        defaultProvider: p.provider as ApiProvider,
        isPreset: true,
        provider: override?.provider ?? (p.provider as ApiProvider),
        apiKey: override?.apiKey,
        baseUrl: override?.baseUrl,
      };
    }),
    ...customModels.map(m => ({
      id: m.id,
      modelId: m.name,
      displayName: m.displayName || m.name,
      description: `自定义 ${m.provider} 模型`,
      defaultProvider: m.provider,
      isPreset: false,
      provider: m.provider,
      apiKey: m.apiKey,
      baseUrl: m.baseUrl,
    })),
  ];

  const handleAddModel = () => {
    if (!newModelName.trim()) return;
    const trimmedName = newModelName.trim();
    if (customModels.find(m => m.name === trimmedName)) {
      alert(`Model ID "${trimmedName}" 已存在。`);
      return;
    }

    const newModel: CustomModel = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      displayName: newDisplayName.trim() || trimmedName,
      provider: newModelProvider,
      apiKey: newModelApiKey || undefined,
      baseUrl: newModelBaseUrl || undefined,
    };

    setConfig({ ...config, customModels: [...customModels, newModel] });
    setNewModelName('');
    setNewDisplayName('');
    setNewModelApiKey('');
    setNewModelBaseUrl('');
  };

  const handleDeleteCustomModel = (modelId: string) => {
    setConfig({ ...config, customModels: customModels.filter(m => m.id !== modelId) });
    if (expandedId === modelId) setExpandedId(null);
  };

  const handleResetPreset = (presetValue: string) => {
    const overrides = (config.presetOverrides || []).filter(o => o.name !== presetValue);
    setConfig({ ...config, presetOverrides: overrides });
  };

  const handleUpdateCustomModel = (modelId: string, updates: Partial<CustomModel>) => {
    setConfig({
      ...config,
      customModels: customModels.map(m => m.id === modelId ? { ...m, ...updates } : m),
    });
  };

  const handleUpdatePresetOverride = (presetValue: string, updates: Partial<CustomModel>) => {
    const overrides = (config.presetOverrides || []).filter(o => o.name !== presetValue);
    const existing = presetOverrides[presetValue];
    overrides.push({ ...(existing || { id: `override-${presetValue}`, name: presetValue, provider: 'google' as ApiProvider }), ...updates });
    setConfig({ ...config, presetOverrides: overrides });
  };

  const handleUpdate = (item: typeof allModels[0], updates: { provider?: ApiProvider; apiKey?: string; baseUrl?: string }) => {
    if (item.isPreset) {
      handleUpdatePresetOverride(item.modelId, updates);
    } else {
      handleUpdateCustomModel(item.id, updates);
    }
  };

  const handleUpdateDisplayName = (item: typeof allModels[0], displayName: string) => {
    if (item.isPreset) return; // preset display name comes from MODELS config
    handleUpdateCustomModel(item.id, { displayName });
  };

  return (
    <div className="space-y-4 pt-1">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">模型管理</h3>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
        {/* Unified Model List */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500 mb-3">
            已添加模型 ({allModels.length})
          </div>

          {allModels.map((item) => {
            const isExpanded = expandedId === item.id;
            const isOverridden = item.isPreset && presetOverrides[item.modelId];

            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg border transition-colors ${isOverridden ? 'border-blue-200' : 'border-slate-200'} hover:border-slate-300`}
              >
                <div
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {item.displayName}
                      </span>
                      {item.isPreset && (
                        <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                          预设
                        </span>
                      )}
                      {isOverridden && (
                        <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                          已自定义
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      ID: {item.modelId} • {item.provider}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400" />
                    )}
                    {!item.isPreset && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustomModel(item.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="移除模型"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {item.isPreset && isOverridden && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResetPreset(item.modelId); }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="重置为默认配置"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Display Name (custom only) */}
                    {!item.isPreset && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                          <Tag size={10} />
                          显示名称
                        </label>
                        <input
                          type="text"
                          value={item.displayName}
                          onChange={(e) => handleUpdateDisplayName(item, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                        />
                      </div>
                    )}

                    {/* Provider */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                        <Bot size={10} />
                        API 类型
                      </label>
                      <select
                        value={item.provider}
                        onChange={(e) => handleUpdate(item, { provider: e.target.value as ApiProvider })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                      >
                        {PROVIDER_OPTIONS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                        <Key size={10} />
                        API 密钥
                      </label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={item.apiKey || ''}
                        onChange={(e) => handleUpdate(item, { apiKey: e.target.value || undefined })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    {/* Base URL */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                        <Globe size={10} />
                        基础 URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://api.example.com/v1"
                        value={item.baseUrl || ''}
                        onChange={(e) => handleUpdate(item, { baseUrl: e.target.value || undefined })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Model */}
        <div className="border-t border-slate-200 pt-4">
          <div className="text-xs font-medium text-slate-500 mb-3">添加新模型</div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Bot size={14} className="text-slate-400" />
                  Model ID（必填）
                </label>
                <input
                  type="text"
                  placeholder="例如：llama-3-8b-instruct"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Tag size={14} className="text-slate-400" />
                  Display Name（选填）
                </label>
                <input
                  type="text"
                  placeholder="例如：Llama 3 (8B)"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">API 类型</label>
              <select
                value={newModelProvider}
                onChange={(e) => setNewModelProvider(e.target.value as ApiProvider)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                {PROVIDER_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Key size={14} className="text-slate-400" />
                API Key（选填）
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={newModelApiKey}
                onChange={(e) => setNewModelApiKey(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Globe size={14} className="text-slate-400" />
                Base URL（选填）
              </label>
              <input
                type="text"
                placeholder="https://api.example.com/v1"
                value={newModelBaseUrl}
                onChange={(e) => setNewModelBaseUrl(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={handleAddModel}
              disabled={!newModelName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-sm"
            >
              <Plus size={16} />
              添加模型
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSection;
