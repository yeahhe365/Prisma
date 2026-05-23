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
  const inputClass =
    'block w-full rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-2 text-sm text-[var(--theme-text-primary)] outline-none placeholder:text-[var(--theme-text-tertiary)] transition-colors focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20';
  const labelClass =
    'flex items-center gap-1 text-[11px] font-bold uppercase tracking-tight text-[var(--theme-text-tertiary)]';

  return (
    <div
      className={`rounded-lg border bg-[var(--theme-bg-input)] transition-colors ${
        isOverridden ? 'border-[var(--theme-border-focus)]' : 'border-[var(--theme-border-secondary)]'
      } hover:border-[var(--theme-border-focus)]`}
    >
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[var(--theme-text-primary)]">{item.displayName}</span>
            {item.isPreset && (
              <span className="shrink-0 rounded border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[var(--theme-text-secondary)]">
                预设
              </span>
            )}
            {isOverridden && (
              <span className="shrink-0 text-[9px] font-medium uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                已自定义
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--theme-text-tertiary)]">
            ID: {item.modelId} • {item.provider}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {isExpanded ? (
            <ChevronUp size={16} className="text-[var(--theme-text-tertiary)]" />
          ) : (
            <ChevronDown size={16} className="text-[var(--theme-text-tertiary)]" />
          )}
          {!item.isPreset && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-bg-danger)]/10 hover:text-[var(--theme-text-danger)]"
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
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-bg-warning)] hover:text-[var(--theme-text-warning)]"
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
              <label className={labelClass}>
                <Tag size={10} />
                显示名称
              </label>
              <input
                type="text"
                value={item.displayName}
                onChange={(e) => onUpdateDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>
              <Bot size={10} />
              API 类型
            </label>
            <select
              value={item.provider}
              onChange={(e) => onUpdate({ provider: e.target.value as ApiProvider })}
              className={inputClass}
            >
              {PROVIDER_OPTIONS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>
              <Key size={10} />
              API 密钥
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={item.apiKey || ''}
              onChange={(e) => onUpdate({ apiKey: e.target.value || undefined })}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>
              <Globe size={10} />
              基础 URL
            </label>
            <input
              type="text"
              placeholder="https://api.example.com/v1"
              value={item.baseUrl || ''}
              onChange={(e) => onUpdate({ baseUrl: e.target.value || undefined })}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelListItem;
