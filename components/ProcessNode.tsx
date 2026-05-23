import React from 'react';
import { Loader2, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';

interface ProcessNodeProps {
  icon: React.ElementType;
  title: string;
  status: 'idle' | 'active' | 'completed';
  children?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  glow?: boolean;
}

const ProcessNode = ({
  icon: Icon,
  title,
  status,
  children,
  isExpanded,
  onToggle,
  glow = false,
}: ProcessNodeProps) => {
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  return (
    <div
      className={`relative z-10 overflow-hidden rounded-xl border transition-all duration-500 shadow-sm
      ${isActive ? 'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)]' : 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)]'}
      ${glow ? 'shadow-[0_0_20px_rgba(64,65,79,0.12)] dark:shadow-[0_0_20px_rgba(59,130,246,0.16)]' : ''}
    `}
    >
      <div
        className="flex cursor-pointer items-center justify-between p-5 hover:bg-[var(--theme-bg-tertiary)]/45"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
            flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300
            ${isActive ? 'animate-pulse bg-[var(--theme-bg-accent)] text-[var(--theme-text-accent)]' : ''}
            ${isCompleted ? 'bg-[var(--theme-text-success)] text-[var(--theme-text-accent)]' : 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-tertiary)]'}
          `}
          >
            {isActive ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 size={16} />
            ) : (
              <Icon size={16} />
            )}
          </div>
          <div>
            <h3
              className={`text-sm font-semibold ${isActive || isCompleted ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-secondary)]'}`}
            >
              {title}
            </h3>
            {isActive && <p className="text-xs text-[var(--theme-text-link)]">处理中...</p>}
          </div>
        </div>
        {children && (
          <div className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </div>

      {isExpanded && children && (
        <div className="border-t border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)]/45 p-5 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProcessNode;
