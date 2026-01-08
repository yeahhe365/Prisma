
import React from 'react';
import { Settings, ChevronDown, Menu } from 'lucide-react';
import { MODELS } from '../config';
import { ModelOption } from '../types';
import Logo from './Logo';

interface HeaderProps {
  selectedModel: ModelOption;
  setSelectedModel: (model: ModelOption) => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

const Header = ({ selectedModel, setSelectedModel, onOpenSettings, onToggleSidebar, onNewChat }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Toggle History"
          >
            <Menu size={20} />
          </button>
          
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={onNewChat}
            title="Start New Chat"
          >
            <Logo className="w-8 h-8 transition-transform group-hover:scale-110" />
            <h1 className="font-bold text-lg tracking-tight text-blue-600 group-hover:opacity-70 transition-opacity">
              <span className="font-light">Prisma</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative group">
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
              className="relative bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-auto p-2.5 outline-none appearance-none cursor-pointer pl-3 pr-8 shadow-sm font-medium hover:bg-slate-50 transition-colors"
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={14} />
          </div>

          <button 
            onClick={onOpenSettings}
            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors text-slate-500 hover:text-slate-900 shadow-sm"
            title="Configuration"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
