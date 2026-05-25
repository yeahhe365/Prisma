import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ThinkingLevel } from '@/types';

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
      <label className="block text-sm font-semibold text-[var(--theme-text-primary)]">
        {label}
      </label>
      <p className="text-xs leading-relaxed text-[var(--theme-text-tertiary)]">{desc}</p>
    </div>
    <div className="relative w-[min(280px,45%)] shrink-0 max-sm:w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ThinkingLevel)}
        className="block min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-2.5 text-sm uppercase tracking-wider text-[var(--theme-text-primary)] outline-none transition-colors hover:border-[var(--theme-border-focus)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[var(--theme-border-focus)]/20"
      >
        {validLevels.map((l) => (
          <option key={l} value={l}>
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-3 text-[var(--theme-text-tertiary)]"
        size={14}
      />
    </div>
  </div>
);

export default LevelSelect;
