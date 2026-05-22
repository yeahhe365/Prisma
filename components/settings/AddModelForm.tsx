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
              value={modelName}
              aria-invalid={Boolean(modelNameError)}
              aria-describedby={modelNameError ? 'new-model-name-error' : undefined}
              onChange={(e) => {
                setModelName(e.target.value);
                if (modelNameError) setModelNameError('');
              }}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
            />
            {modelNameError && (
              <p id="new-model-name-error" role="alert" className="text-xs text-red-600">
                {modelNameError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Tag size={14} className="text-slate-400" />
              Display Name（选填）
            </label>
            <input
              type="text"
              placeholder="例如：Llama 3 (8B)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">API 类型</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as ApiProvider)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
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
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
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
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={handleAddModel}
          disabled={!modelName.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-sm"
        >
          <Plus size={16} />
          添加模型
        </button>
      </div>
    </div>
  );
};

export default AddModelForm;
