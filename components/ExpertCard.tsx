import React, { useState, useEffect } from 'react';
import {
  Bot,
  Loader2,
  CheckCircle2,
  X,
  BrainCircuit,
  MessageSquareText,
  Thermometer,
  Timer,
  Repeat,
} from 'lucide-react';
import LazyMarkdownRenderer from './LazyMarkdownRenderer';
import { ExpertResult } from '../types';

// Simple component to format milliseconds to ss.ms or mm:ss
const TimeDisplay = ({ start, end, status }: { start?: number; end?: number; status: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    // Update live timer
    if (status === 'thinking' && start) {
      // Calculate initial diff immediately
      setElapsed(Date.now() - start);
      interval = setInterval(() => {
        setElapsed(Date.now() - start);
      }, 100);
    }
    // Show final duration
    else if ((status === 'completed' || status === 'error') && start && end) {
      setElapsed(end - start);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [status, start, end]);

  if (!start) return null;

  const seconds = (elapsed / 1000).toFixed(1);
  return (
    <div className="flex items-center gap-1 rounded border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--theme-text-tertiary)]">
      <Timer size={10} />
      <span>{seconds}s</span>
    </div>
  );
};

const ExpertCard = ({ expert }: { expert: ExpertResult }) => {
  const [view, setView] = useState<'thoughts' | 'output'>('output');

  const isWorking = expert.status === 'thinking';
  const isDone = expert.status === 'completed';
  const isPending = expert.status === 'pending';
  const isError = expert.status === 'error';
  const round = expert.round || 1;

  // Auto-switch to thoughts if that's all we have so far
  useEffect(() => {
    if (isWorking && expert.thoughts && !expert.content) {
      setView('thoughts');
    } else if (expert.content && view === 'thoughts' && !expert.thoughts) {
      setView('output');
    }
  }, [expert.thoughts, expert.content, isWorking, view]);

  return (
    <div
      className={`
      relative flex min-h-[220px] max-h-[420px] flex-col overflow-hidden rounded-xl border transition-all duration-300 shadow-sm
      ${isWorking ? 'animate-pulse-subtle border-[var(--theme-border-focus)] bg-[var(--theme-bg-input)] shadow-[0_0_15px_rgba(64,65,79,0.1)]' : ''}
      ${isDone ? 'border-[var(--theme-text-success)] bg-[var(--theme-bg-input)]' : ''}
      ${isPending ? 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)]/50' : ''}
      ${isError ? 'border-[var(--theme-text-danger)] bg-[var(--theme-bg-error-message)]' : ''}
    `}
    >
      {/* Header */}
      <div
        className={`flex items-start gap-3 border-b p-4 ${
          isDone
            ? 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-success)]'
            : 'border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)]/50'
        }`}
      >
        <div
          className={`mt-0.5 rounded-lg p-1.5 ${
            isWorking
              ? 'bg-[var(--theme-bg-accent)]/10 text-[var(--theme-text-link)]'
              : isError
                ? 'bg-[var(--theme-bg-danger)]/10 text-[var(--theme-text-danger)]'
                : 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]'
          }`}
        >
          <Bot size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-bold leading-tight text-[var(--theme-text-primary)]">
                {expert.role}
              </h3>
              {round > 1 && (
                <div className="flex items-center gap-0.5 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                  <Repeat size={8} />第 {round} 轮
                </div>
              )}
            </div>

            {/* Timer for Expert */}
            <TimeDisplay start={expert.startTime} end={expert.endTime} status={expert.status} />
          </div>

          <div className="flex items-center gap-2">
            <p className="flex-1 truncate text-[10px] text-[var(--theme-text-tertiary)]">{expert.description}</p>
            {expert.temperature !== undefined && (
              <div
                className="flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)]/50 px-1.5 py-0.5 font-mono text-[9px] text-[var(--theme-text-tertiary)]"
                title={`Temperature: ${expert.temperature}`}
              >
                <Thermometer size={8} />
                <span>{expert.temperature}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 pt-0.5">
          {isWorking && <Loader2 size={16} className="animate-spin text-[var(--theme-border-focus)]" />}
          {isDone && <CheckCircle2 size={16} className="text-[var(--theme-text-success)]" />}
          {isError && <X size={16} className="text-[var(--theme-text-danger)]" />}
        </div>
      </div>

      {/* Tabs */}
      {!isPending && (
        <div className="flex border-b border-[var(--theme-border-primary)] text-[10px] font-medium uppercase tracking-wider">
          <button
            onClick={() => setView('thoughts')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 transition-colors ${
              view === 'thoughts'
                ? 'border-b-2 border-[var(--theme-border-focus)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]'
                : 'text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-bg-tertiary)]/50 hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <BrainCircuit size={12} />
            推理
          </button>
          <button
            onClick={() => setView('output')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 transition-colors ${
              view === 'output'
                ? 'border-b-2 border-[var(--theme-text-success)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]'
                : 'text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-bg-tertiary)]/50 hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <MessageSquareText size={12} />
            输出
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="custom-scrollbar flex-1 overflow-y-auto bg-[var(--theme-bg-input)] p-5">
        {isPending ? (
          <div className="flex h-full flex-col items-center justify-center text-[var(--theme-text-tertiary)]">
            <Bot size={32} className="mb-2 opacity-50" />
            <span className="text-xs italic">等待分配任务...</span>
          </div>
        ) : (
          <>
            {view === 'thoughts' && (
              <div className="prose prose-xs max-w-none">
                {expert.thoughts ? (
                  isWorking ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[var(--theme-text-secondary)]">
                      {expert.thoughts}
                    </pre>
                  ) : (
                    <LazyMarkdownRenderer
                      content={expert.thoughts}
                      className="font-mono text-[11px] leading-relaxed text-[var(--theme-text-secondary)]"
                    />
                  )
                ) : (
                  <span className="italic opacity-50 text-[11px]">初始化思考过程...</span>
                )}
                {isWorking && (
                  <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-[var(--theme-border-focus)]" />
                )}
              </div>
            )}

            {view === 'output' && (
              <div className="prose prose-sm max-w-none">
                {expert.content ? (
                  isWorking ? (
                    <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                      {expert.content}
                    </pre>
                  ) : (
                    <LazyMarkdownRenderer
                      content={expert.content}
                      className="text-xs leading-relaxed text-[var(--theme-text-secondary)]"
                    />
                  )
                ) : (
                  <span className="text-[11px] italic text-[var(--theme-text-tertiary)]">
                    {isWorking ? '生成输出中...' : '未生成输出。'}
                  </span>
                )}
                {isWorking && !expert.content && (
                  <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-[var(--theme-text-success)]" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExpertCard;
