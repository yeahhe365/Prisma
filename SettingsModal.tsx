
import React from 'react';
import { Settings, X } from 'lucide-react';
import { AppConfig, ModelOption } from './types';
import ModelSection from './components/settings/ModelSection';
import ThinkingSection from './components/settings/ThinkingSection';
import GithubSection from './components/settings/GithubSection';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">设置</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-full p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <ModelSection config={config} setConfig={setConfig} />

          <ThinkingSection
            config={config}
            setConfig={setConfig}
            model={model}
          />

          <GithubSection isOpen={isOpen} />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-md active:scale-95"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
