import React from 'react';
import { Settings, Sun, Moon, SquarePen } from 'lucide-react';
import { getAllModels } from '@/config';
import type { ModelOption, AppConfig } from '@/types';
import ModelPicker from '@/components/ModelPicker';

interface HeaderProps {
  selectedModel: ModelOption | null;
  setSelectedModel: (model: ModelOption) => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  config: AppConfig;
  isDark: boolean;
  onToggleDark: () => void;
}

const Header = ({
  selectedModel,
  setSelectedModel,
  onOpenSettings,
  onToggleSidebar,
  onNewChat,
  config,
  isDark,
  onToggleDark,
}: HeaderProps) => {
  const availableModels = getAllModels(config);
  const selectedModelInfo = availableModels.find((model) => model.value === selectedModel);
  const hasModels = availableModels.length > 0;
  const selectedModelLabel = selectedModelInfo?.label || selectedModel || '未配置模型';
  const abbreviatedModelName = selectedModelLabel
    .replace(/^Gemini\s+/i, '')
    .replace(/\s+Preview/i, '')
    .replace(/\s+Latest/i, '');
  const headerButtonBase =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200 ease-[cubic-bezier(0.19,1,0.22,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-primary)]';
  const headerButtonInactive =
    'bg-transparent text-[var(--theme-icon-settings)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] active:bg-[var(--theme-bg-tertiary)]';

  return (
    <header className="relative z-20 flex flex-shrink-0 items-center justify-between gap-2 bg-[var(--theme-bg-primary)] px-2 py-[0.32rem] sm:gap-3 sm:px-3 sm:py-[0.48rem]">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className={`${headerButtonBase} ${headerButtonInactive} md:hidden`}
          title="切换历史记录"
          aria-label="切换历史记录"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="4" x2="20" y1="8" y2="8" />
            <line x1="4" x2="14" y1="16" y2="16" />
          </svg>
        </button>

        <div className="min-w-0">
          <ModelPicker
            models={availableModels}
            selectedId={selectedModel}
            onSelect={setSelectedModel}
            renderTrigger={({ isOpen, setIsOpen, listboxId, activeDescendantId }) => (
              <button
                onClick={() => {
                  if (!hasModels) {
                    onOpenSettings();
                    return;
                  }
                  setIsOpen(!isOpen);
                }}
                className="flex min-h-9 items-center gap-2 rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-base font-medium text-[var(--theme-text-primary)] transition-all duration-200 ease-out hover:border-[var(--theme-border-secondary)] hover:bg-[var(--theme-bg-tertiary)] active:bg-[var(--theme-bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-primary)] sm:px-3"
                title={
                  hasModels
                    ? `当前模型：${selectedModelLabel}。切换模型`
                    : '未配置模型。打开模型设置'
                }
                aria-label={
                  hasModels
                    ? `当前模型：${selectedModelLabel}。切换模型`
                    : '未配置模型。打开模型设置'
                }
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                aria-activedescendant={isOpen ? activeDescendantId : undefined}
              >
                <span
                  data-testid="header-model-selector-label"
                  className="max-w-[180px] truncate font-semibold sm:max-w-[220px]"
                >
                  {abbreviatedModelName}
                </span>
              </button>
            )}
          />
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-end gap-1 sm:gap-2.5">
        <button
          onClick={onToggleDark}
          className={`${headerButtonBase} ${headerButtonInactive}`}
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
          aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={onOpenSettings}
          className={`${headerButtonBase} ${headerButtonInactive}`}
          title="设置"
          aria-label="设置"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={onNewChat}
          className={`${headerButtonBase} ${headerButtonInactive} sm:hidden`}
          title="新建对话"
          aria-label="新建对话"
        >
          <SquarePen size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
