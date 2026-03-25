
import React from 'react';
import { Settings, ChevronDown, Menu, Sun, Moon } from 'lucide-react';
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

const Header = ({ selectedModel, setSelectedModel, onOpenSettings, onToggleSidebar, onNewChat, config, isDark, onToggleDark }: HeaderProps) => {
  const availableModels = getAllModels(config);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="切换历史记录"
          >
            <Menu size={20} />
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={onNewChat}
            title="开始新对话"
          >
            <Logo className="w-8 h-8 transition-transform group-hover:scale-110" />
            <h1 className="font-bold text-lg tracking-tight text-blue-600 group-hover:opacity-70 transition-opacity">
              Prisma
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative group">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
              className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-auto p-2.5 outline-none appearance-none cursor-pointer pl-3 pr-8 shadow-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {availableModels.map(m => (
                <option key={`${m.provider}-${m.value}`} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 pointer-events-none group-hover:text-slate-600 transition-colors" size={14} />
          </div>

          <button
            onClick={onToggleDark}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm"
            title={isDark ? '切换到浅色模式' : '切换到深色模式'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shadow-sm"
            title="设置"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;