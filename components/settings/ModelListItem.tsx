import React from 'react';
import { Bot, ChevronDown, ChevronUp, Globe, Key, RotateCcw, Tag, Trash2 } from 'lucide-react';
import { ApiProvider } from '../../types';
import { EditableModelItem, PROVIDER_OPTIONS } from './modelSettings';

interface ModelListItemProps {
  item: EditableModelItem;
  isExpanded: boolean;
  isOverridden: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onReset: () => void;
  onUpdate: (updates: { provider?: ApiProvider; apiKey?: string; baseUrl?: string }) => void;
  onUpdateDisplayName: (displayName: string) => void;
}

const ModelListItem = ({
  item,
  isExpanded,
  isOverridden,
  onToggle,
  onDelete,
  onReset,
  onUpdate,
  onUpdateDisplayName,
}: ModelListItemProps) => {
  return (
    <div
      className={`bg-white rounded-lg border transition-colors ${
        isOverridden ? 'border-blue-200' : 'border-slate-200'
      } hover:border-slate-300`}
    >
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 truncate">{item.displayName}</span>
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="移除模型"
            >
              <Trash2 size={16} />
            </button>
          )}
          {item.isPreset && isOverridden && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
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
          {!item.isPreset && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                <Tag size={10} />
                显示名称
              </label>
              <input
                type="text"
                value={item.displayName}
                onChange={(e) => onUpdateDisplayName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Bot size={10} />
              API 类型
            </label>
            <select
              value={item.provider}
              onChange={(e) => onUpdate({ provider: e.target.value as ApiProvider })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
            >
              {PROVIDER_OPTIONS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Key size={10} />
              API 密钥
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={item.apiKey || ''}
              onChange={(e) => onUpdate({ apiKey: e.target.value || undefined })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
              <Globe size={10} />
              基础 URL
            </label>
            <input
              type="text"
              placeholder="https://api.example.com/v1"
              value={item.baseUrl || ''}
              onChange={(e) => onUpdate({ baseUrl: e.target.value || undefined })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelListItem;
