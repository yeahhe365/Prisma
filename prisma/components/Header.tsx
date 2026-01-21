
import React from 'react';
import { Settings, ChevronDown, Menu } from 'lucide-react';
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
}

const Header = ({ selectedModel, setSelectedModel, onOpenSettings, onToggleSidebar, onNewChat, config }: HeaderProps) => {
  const availableModels = getAllModels(config);

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
      <div className="w-full px-6 h-16 flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-5">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 rounded-lg transition-all duration-200 active:scale-95"
            title="Toggle History"
          >
            <Menu size={20} strokeWidth={2} />
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={onNewChat}
            title="Start New Chat"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full"></div>
              <Logo className="relative w-8 h-8 transition-transform group-hover:scale-105 duration-300 drop-shadow-sm" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900 font-display">
              Prisma
              <span className="text-indigo-500 ml-0.5 font-extrabold">.ai</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group hidden sm:block">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
              className="relative bg-white/50 border border-slate-200 hover:border-indigo-400/50 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 block w-auto py-2 pl-3 pr-9 outline-none appearance-none cursor-pointer font-medium transition-all duration-200 hover:bg-white hover:shadow-sm"
            >
              {availableModels.map(m => (
                <option key={`${m.provider}-${m.value}`} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-600 transition-colors" size={14} strokeWidth={2.5} />
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/50 border border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-500 hover:text-slate-900 group active:scale-95"
            title="Configuration"
          >
            <Settings size={18} strokeWidth={2} className="group-hover:rotate-45 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;