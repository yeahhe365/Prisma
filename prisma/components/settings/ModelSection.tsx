
import React, { useState } from 'react';
import { Plus, Trash2, Bot, Key, Globe, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { AppConfig, ApiProvider, CustomModel } from '../../types';
import { MODELS } from '../../config';

interface ModelSectionProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
}

const ModelSection = ({ config, setConfig }: ModelSectionProps) => {
  const [newModelName, setNewModelName] = useState(''); // This is Model ID
  const [newDisplayName, setNewDisplayName] = useState(''); // This is Friendly Name
  const [newModelProvider, setNewModelProvider] = useState<ApiProvider>('custom');
  const [newModelApiKey, setNewModelApiKey] = useState('');
  const [newModelBaseUrl, setNewModelBaseUrl] = useState('');
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);

  const customModels = config.customModels || [];

  const handleAddModel = () => {
    if (!newModelName.trim()) return;

    const trimmedName = newModelName.trim();
    const trimmedDisplayName = newDisplayName.trim() || trimmedName;

    // Check if model ID already exists in custom models to prevent logic duplicates
    const existingCustomModel = customModels.find(m => m.name === trimmedName);
    if (existingCustomModel) {
      alert(`Model ID "${trimmedName}" already exists. Please choose a different Model ID.`);
      return;
    }

    const newModel: CustomModel = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      displayName: trimmedDisplayName,
      provider: newModelProvider,
      apiKey: newModelApiKey || undefined,
      baseUrl: newModelBaseUrl || undefined
    };

    setConfig({
      ...config,
      customModels: [...customModels, newModel]
    });

    setNewModelName('');
    setNewDisplayName('');
    setNewModelApiKey('');
    setNewModelBaseUrl('');
  };

  const handleDeleteModel = (modelId: string) => {
    setConfig({
      ...config,
      customModels: customModels.filter(m => m.id !== modelId)
    });
    if (expandedModelId === modelId) {
      setExpandedModelId(null);
    }
  };

  const handleUpdateModel = (modelId: string, updates: Partial<CustomModel>) => {
    setConfig({
      ...config,
      customModels: customModels.map(m =>
        m.id === modelId ? { ...m, ...updates } : m
      )
    });
  };

  return (
    <div className="space-y-4 pt-1">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Models</h3>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Bot size={14} className="text-slate-400" />
                Model ID (Required)
              </label>
              <input
                type="text"
                placeholder="e.g., llama-3-8b-instruct"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Tag size={14} className="text-slate-400" />
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Llama 3 (8B)"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Provider</label>
            <select
              value={newModelProvider}
              onChange={(e) => setNewModelProvider(e.target.value as ApiProvider)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              <option value="custom">Custom (OpenAI-compatible)</option>
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="anthropic">Anthropic</option>
              <option value="xai">xAI</option>
              <option value="mistral">Mistral</option>
              <option value="google">Google</option>
            </select>
          </div>

          {(newModelProvider === 'custom' || newModelProvider === 'openai' || newModelProvider === 'anthropic' || newModelProvider === 'xai' || newModelProvider === 'mistral' || newModelProvider === 'google' || newModelProvider === 'deepseek') && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Key size={14} className="text-slate-400" />
                  API Key (optional)
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
                  Base URL (optional)
                </label>
                <input
                  type="text"
                  placeholder="https://api.example.com/v1"
                  value={newModelBaseUrl}
                  onChange={(e) => setNewModelBaseUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
                />
              </div>
            </>
          )}

          <button
            onClick={handleAddModel}
            disabled={!newModelName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-sm"
          >
            <Plus size={16} />
            Add Model
          </button>
        </div>

        {customModels.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <div className="text-xs font-medium text-slate-500 mb-3">
              Added Models ({customModels.length})
            </div>
            <div className="space-y-2">
              {customModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => setExpandedModelId(expandedModelId === model.id ? null : model.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {model.displayName || model.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        ID: {model.name} • {model.provider}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {expandedModelId === model.id ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModel(model.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove model"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {expandedModelId === model.id && (
                    <div className="px-3 pb-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                          <Tag size={10} />
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={model.displayName || ''}
                          onChange={(e) => handleUpdateModel(model.id, { displayName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                          <Key size={10} />
                          API Key
                        </label>
                        <input
                          type="password"
                          placeholder="sk-..."
                          value={model.apiKey || ''}
                          onChange={(e) => handleUpdateModel(model.id, { apiKey: e.target.value || undefined })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                          <Globe size={10} />
                          Base URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://api.example.com/v1"
                          value={model.baseUrl || ''}
                          onChange={(e) => handleUpdateModel(model.id, { baseUrl: e.target.value || undefined })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSection;
