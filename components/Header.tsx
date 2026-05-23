import React from 'react';
import { Settings, ChevronDown, Sun, Moon, SquarePen } from 'lucide-react';
import { getAllModels } from '../config';
import { ModelOption, AppConfig } from '../types';
import Logo from './Logo';

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
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ease-[cubic-bezier(0.19,1,0.22,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-primary)]';
  const headerButtonInactive =
    'bg-transparent text-[var(--theme-icon-settings)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] active:bg-[var(--theme-bg-tertiary)]';

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)]">
      <div className="flex h-[52px] w-full items-center justify-between gap-2 px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className={`${headerButtonBase} ${headerButtonInactive}`}
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

          <div
            className="group flex min-w-0 cursor-pointer items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-[var(--theme-bg-tertiary)]"
            onClick={onNewChat}
            title="开始新对话"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onNewChat();
              }
            }}
          >
            <Logo className="h-7 w-7 text-[var(--theme-text-primary)] transition-opacity group-hover:opacity-80" />
            <h1 className="hidden truncate text-base font-semibold tracking-normal text-[var(--theme-text-primary)] sm:block">
              Prisma
            </h1>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2.5">
          <div className="relative group min-w-0">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
              className="relative block min-h-9 w-auto max-w-[32vw] cursor-pointer appearance-none truncate rounded-xl border border-transparent bg-transparent py-2 pl-3 pr-8 text-sm font-semibold text-[var(--theme-text-primary)] outline-none transition-all duration-200 hover:border-[var(--theme-border-secondary)] hover:bg-[var(--theme-bg-tertiary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20 sm:max-w-none"
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
      </div>
    </header>
  );
};

export default Header;
