
import React from 'react';
import { Key, Globe } from 'lucide-react';
import { AppConfig } from '../../types';

interface ApiSectionProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
}

const ApiSection = ({ config, setConfig }: ApiSectionProps) => {
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between mb-2">
         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Connection</h3>
         <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.enableCustomApi ?? false} 
              onChange={(e) => setConfig({ ...config, enableCustomApi: e.target.checked })} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
      </div>
      
      {config.enableCustomApi && (
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Key size={14} className="text-slate-400" />
              Custom API Key
            </label>
            <input 
              type="password"
              placeholder="sk-..."
              value={config.customApiKey || ''}
              onChange={(e) => setConfig({ ...config, customApiKey: e.target.value })}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Globe size={14} className="text-slate-400" />
              Custom Base URL
            </label>
            <input 
              type="text"
              placeholder="https://generativelanguage.googleapis.com"
              value={config.customBaseUrl || ''}
              onChange={(e) => setConfig({ ...config, customBaseUrl: e.target.value })}
              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiSection;
