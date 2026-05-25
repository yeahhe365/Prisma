import React from 'react';
import { CheckCircle2, ChevronDown, CircleDashed, Loader2 } from 'lucide-react';
import type { ProcessNodeStatus } from '@/components/processFlowStatus';

interface ProcessNodeProps {
  icon: React.ElementType;
  title: string;
  summary?: string;
  status: ProcessNodeStatus;
  children?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  meta?: React.ReactNode;
}

const statusStyles: Record<
  ProcessNodeStatus,
  {
    label: string;
    icon: React.ElementType;
    marker: string;
    iconBox: string;
    badge: string;
  }
> = {
  idle: {
    label: '等待',
    icon: CircleDashed,
    marker: 'bg-[var(--theme-border-secondary)]',
    iconBox: 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-tertiary)]',
    badge:
      'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-tertiary)]',
  },
  active: {
    label: '进行中',
    icon: Loader2,
    marker: 'bg-[var(--theme-border-focus)]',
    iconBox: 'bg-[var(--theme-bg-info)] text-[var(--theme-text-link)]',
    badge:
      'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)] text-[var(--theme-text-info)]',
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    marker: 'bg-[var(--theme-text-success)]',
    iconBox: 'bg-[var(--theme-bg-success)] text-[var(--theme-text-success)]',
    badge:
      'border-[var(--theme-text-success)]/30 bg-[var(--theme-bg-success)] text-[var(--theme-text-success)]',
  },
};

const ProcessNode = ({
  icon: Icon,
  title,
  summary,
  status,
  children,
  isExpanded,
  onToggle,
  meta,
}: ProcessNodeProps) => {
  const statusStyle = statusStyles[status];
  const StatusIcon = statusStyle.icon;
  const hasChildren = !!children;

  return (
    <section className="relative" data-process-node-status={status}>
      <div
        className={`absolute left-5 top-5 h-2.5 w-2.5 rounded-full ${statusStyle.marker}`}
        aria-hidden="true"
      />

      <button
        type="button"
        className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--theme-bg-tertiary)]/45 focus:outline-none focus-visible:bg-[var(--theme-bg-tertiary)]/60"
        onClick={onToggle}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        <div
          className={`ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusStyle.iconBox}`}
        >
          <Icon size={17} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--theme-text-primary)]">
              {title}
            </h3>
            <span
              className={`hidden shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex ${statusStyle.badge}`}
            >
              <StatusIcon
                size={11}
                className={status === 'active' ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              {statusStyle.label}
            </span>
          </div>
          {summary && (
            <p className="mt-0.5 truncate text-xs leading-5 text-[var(--theme-text-tertiary)]">
              {summary}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {meta}
          <ChevronDown
            size={16}
            className={`text-[var(--theme-text-tertiary)] transition-transform duration-200 group-hover:text-[var(--theme-text-primary)] ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isExpanded && hasChildren && (
        <div className="pb-4 pl-4 pr-4 animate-in fade-in slide-in-from-top-1 sm:pl-[4.75rem]">
          {children}
        </div>
      )}
    </section>
  );
};

export default ProcessNode;
