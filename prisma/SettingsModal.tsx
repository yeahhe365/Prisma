
import React from 'react';
import { Settings, X } from 'lucide-react';
import { AppConfig, ModelOption } from './types';
import ApiSection from './components/settings/ApiSection';
import ModelSection from './components/settings/ModelSection';
import ThinkingSection from './components/settings/ThinkingSection';
import GithubSection from './components/settings/GithubSection';
import LogSection from './components/settings/LogSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  model: ModelOption;
}

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  config, 
  setConfig, 
  model 
}: SettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white backdrop-blur-2xl border border-white/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] ring-1 ring-black/5">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <Settings size={18} strokeWidth={2.5} />
            </div>
            <h2 className="font-bold text-slate-800 text-lg tracking-tight">Configuration</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors rounded-full p-2 hover:bg-slate-100">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <ModelSection config={config} setConfig={setConfig} />
          <div className="h-px bg-slate-200/50" />
          <ThinkingSection
            config={config}
            setConfig={setConfig}
            model={model}
          />
          <div className="h-px bg-slate-200/50" />
          <ApiSection config={config} setConfig={setConfig} />
          
          <LogSection />

          <GithubSection isOpen={isOpen} />
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
