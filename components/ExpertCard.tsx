import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  Repeat,
  Thermometer,
  Timer,
} from 'lucide-react';
import LazyMarkdownRenderer from '@/components/LazyMarkdownRenderer';
import type { ExpertResult } from '@/types';

type ExpertStatus = ExpertResult['status'];

const statusMeta: Record<
  ExpertStatus,
  {
    label: string;
    icon: React.ElementType;
    strip: string;
    badge: string;
    iconBox: string;
  }
> = {
  pending: {
    label: '排队',
    icon: Clock3,
    strip: 'bg-[var(--theme-border-secondary)]',
    badge:
      'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-tertiary)]',
    iconBox: 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-tertiary)]',
  },
  thinking: {
    label: '处理中',
    icon: Loader2,
    strip: 'bg-[var(--theme-border-focus)]',
    badge:
      'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)] text-[var(--theme-text-info)]',
    iconBox: 'bg-[var(--theme-bg-info)] text-[var(--theme-text-link)]',
  },
  completed: {
    label: '完成',
    icon: CheckCircle2,
    strip: 'bg-[var(--theme-text-success)]',
    badge:
      'border-[var(--theme-text-success)]/30 bg-[var(--theme-bg-success)] text-[var(--theme-text-success)]',
    iconBox: 'bg-[var(--theme-bg-success)] text-[var(--theme-text-success)]',
  },
  error: {
    label: '异常',
    icon: AlertTriangle,
    strip: 'bg-[var(--theme-text-danger)]',
    badge:
      'border-[var(--theme-text-danger)]/30 bg-[var(--theme-bg-error-message)] text-[var(--theme-text-danger)]',
    iconBox: 'bg-[var(--theme-bg-error-message)] text-[var(--theme-text-danger)]',
  },
};

const formatDuration = (elapsed: number) => {
  const totalSeconds = Math.max(0, elapsed / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
};

const TimeDisplay = ({
  start,
  end,
  status,
}: {
  start?: number;
  end?: number;
  status: ExpertStatus;
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (status === 'thinking' && start) {
      setElapsed(Date.now() - start);
      interval = setInterval(() => {
        setElapsed(Date.now() - start);
      }, 100);
    } else if ((status === 'completed' || status === 'error') && start && end) {
      setElapsed(end - start);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [status, start, end]);

  if (!start) return null;

  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-1.5 font-mono text-[10px] font-medium text-[var(--theme-text-tertiary)]">
      <Timer size={10} aria-hidden="true" />
      {formatDuration(elapsed)}
    </span>
  );
};

const ExpertCard = ({ expert }: { expert: ExpertResult }) => {
  const [view, setView] = useState<'thoughts' | 'output'>('output');

  const isWorking = expert.status === 'thinking';
  const isDone = expert.status === 'completed';
  const isPending = expert.status === 'pending';
  const isError = expert.status === 'error';
  const round = expert.round || 1;
  const meta = statusMeta[expert.status];
  const StatusIcon = meta.icon;

  useEffect(() => {
    if (isWorking && expert.thoughts && !expert.content) {
      setView('thoughts');
    } else if (expert.content && !expert.thoughts) {
      setView('output');
    }
  }, [expert.thoughts, expert.content, isWorking]);

  return (
    <article
      className={`relative flex min-h-[248px] max-h-[440px] min-w-0 flex-col overflow-hidden rounded-lg border bg-[var(--theme-bg-input)] shadow-sm transition-colors ${
        isWorking ? 'border-[var(--theme-border-focus)]' : ''
      } ${isDone ? 'border-[var(--theme-text-success)]/40' : ''} ${
        isPending ? 'border-[var(--theme-border-secondary)]' : ''
      } ${isError ? 'border-[var(--theme-text-danger)]/50' : ''}`}
      data-testid="expert-card"
      data-expert-status={expert.status}
    >
      <div className={`h-1 shrink-0 ${meta.strip}`} aria-hidden="true" />

      <header className="border-b border-[var(--theme-border-primary)] px-3.5 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconBox}`}
          >
            <Bot size={16} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h4 className="truncate text-sm font-semibold leading-5 text-[var(--theme-text-primary)]">
                {expert.role}
              </h4>
              <span
                className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[10px] font-medium ${meta.badge}`}
              >
                <StatusIcon
                  size={11}
                  className={isWorking ? 'animate-spin' : ''}
                  aria-hidden="true"
                />
                {meta.label}
              </span>
            </div>

            <p className="mt-0.5 truncate text-xs leading-5 text-[var(--theme-text-tertiary)]">
              {expert.description}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <TimeDisplay start={expert.startTime} end={expert.endTime} status={expert.status} />

          {round > 1 && (
            <span className="inline-flex h-6 items-center gap-1 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-1.5 text-[10px] font-medium text-[var(--theme-text-tertiary)]">
              <Repeat size={10} aria-hidden="true" />第 {round} 轮
            </span>
          )}

          {expert.temperature !== undefined && (
            <span
              className="inline-flex h-6 items-center gap-1 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-1.5 font-mono text-[10px] font-medium text-[var(--theme-text-tertiary)]"
              title={`Temperature: ${expert.temperature}`}
            >
              <Thermometer size={10} aria-hidden="true" />
              {expert.temperature}
            </span>
          )}
        </div>
      </header>

      {!isPending && (
        <div
          className="grid grid-cols-2 gap-1 border-b border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)] p-1"
          aria-label="专家内容视图"
        >
          <button
            type="button"
            onClick={() => setView('thoughts')}
            aria-pressed={view === 'thoughts'}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'thoughts'
                ? 'bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-bg-tertiary)]/60 hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <BrainCircuit size={13} aria-hidden="true" />
            推理
          </button>
          <button
            type="button"
            onClick={() => setView('output')}
            aria-pressed={view === 'output'}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'output'
                ? 'bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-bg-tertiary)]/60 hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <MessageSquareText size={13} aria-hidden="true" />
            输出
          </button>
        </div>
      )}

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3.5">
        {isPending ? (
          <div className="flex min-h-[132px] items-center gap-3 rounded-lg border border-dashed border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)]/55 px-3 py-4 text-[var(--theme-text-tertiary)]">
            <Clock3 size={18} className="shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--theme-text-secondary)]">等待任务</p>
              <p className="mt-0.5 text-xs">专家就绪后会自动开始。</p>
            </div>
          </div>
        ) : (
          <>
            {view === 'thoughts' && (
              <div className="max-w-none">
                {expert.thoughts ? (
                  <LazyMarkdownRenderer
                    content={expert.thoughts}
                    className="font-mono text-[11px] leading-5 text-[var(--theme-text-secondary)]"
                    isStreaming={isWorking}
                  />
                ) : (
                  <p className="text-xs text-[var(--theme-text-tertiary)]">暂无推理片段。</p>
                )}
                {isWorking && (
                  <span className="mt-2 inline-block h-3 w-1.5 animate-pulse bg-[var(--theme-border-focus)]" />
                )}
              </div>
            )}

            {view === 'output' && (
              <div className="max-w-none">
                {expert.content ? (
                  <LazyMarkdownRenderer
                    content={expert.content}
                    className="text-xs leading-6 text-[var(--theme-text-secondary)]"
                    isStreaming={isWorking}
                  />
                ) : (
                  <p className="text-xs text-[var(--theme-text-tertiary)]">
                    {isWorking ? '正在生成输出...' : '暂无输出。'}
                  </p>
                )}
                {isWorking && !expert.content && (
                  <span className="mt-2 inline-block h-3 w-1.5 animate-pulse bg-[var(--theme-text-success)]" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
};

export default ExpertCard;
