
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ThinkingLevel } from '../../types';

interface LevelSelectProps {
  label: string;
  value: ThinkingLevel;
  validLevels: ThinkingLevel[];
  onChange: (v: ThinkingLevel) => void;
  desc: string;
}

const LevelSelect = ({ 
  label, 
  value, 
  validLevels,
  onChange,
  desc 
}: LevelSelectProps) => (
  <div className="space-y-2">
    <div className="flex justify-between items-baseline">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-xs text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{value}</span>
    </div>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ThinkingLevel)}
        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none appearance-none cursor-pointer transition-colors hover:border-slate-300"
      >
        {validLevels.map(l => (
          <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
    </div>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

export default LevelSelect;
