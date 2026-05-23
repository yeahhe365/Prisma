import React from 'react';
import { Settings, ChevronDown, Sun, Moon, SquarePen } from 'lucide-react';
import { getAllModels } from '../config';
import { ModelOption, AppConfig } from '../types';

interface HeaderProps {
  selectedModel: ModelOption;
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

        <div className="relative group min-w-0">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
            className="relative block min-h-9 max-w-[180px] cursor-pointer appearance-none truncate rounded-xl border border-transparent bg-transparent py-1.5 pl-2 pr-8 text-base font-semibold text-[var(--theme-text-primary)] outline-none transition-all duration-200 hover:border-[var(--theme-border-secondary)] hover:bg-[var(--theme-bg-tertiary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20 sm:max-w-[220px] sm:px-3"
          >
            {availableModels.map((m) => (
              <option key={`${m.provider}-${m.value}`} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-tertiary)] transition-colors group-hover:text-[var(--theme-text-primary)]"
            size={14}
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
