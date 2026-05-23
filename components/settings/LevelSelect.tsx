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

const LevelSelect = ({ label, value, validLevels, onChange, desc }: LevelSelectProps) => (
  <div className="flex items-center justify-between gap-6 py-3.5 max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
    <div className="min-w-0 flex-1 space-y-1">
      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </label>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
    <div className="relative w-[min(280px,45%)] shrink-0 max-sm:w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ThinkingLevel)}
        className="block min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white p-2.5 text-sm uppercase tracking-wider text-slate-800 outline-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {validLevels.map((l) => (
          <option key={l} value={l}>
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-3 text-slate-400 pointer-events-none"
        size={14}
      />
    </div>
  </div>
);

export default LevelSelect;
