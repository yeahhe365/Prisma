import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Brain, CheckCircle2, Clock3, Loader2, Route, Users, Zap } from 'lucide-react';
import type { AppState, AnalysisResult, ExpertResult } from '@/types';
import ProcessNode from '@/components/ProcessNode';
import ExpertCard from '@/components/ExpertCard';
import {
  getExpertsStatus,
  getManagerStatus,
  getSynthesisStatus,
  type ProcessNodeStatus,
} from '@/components/processFlowStatus';

interface ProcessFlowProps {
  appState: AppState;
  managerAnalysis: AnalysisResult | null;
  experts: ExpertResult[];
  defaultExpanded?: boolean;
  processStartTime?: number | null;
  processEndTime?: number | null;
}

type ProcessSection = 'manager' | 'experts' | 'synthesis';

const runStatus: Record<AppState, { label: string; tone: string }> = {
  idle: {
    label: '待开始',
    tone: 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-tertiary)]',
  },
  analyzing: {
    label: '规划中',
    tone: 'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)] text-[var(--theme-text-info)]',
  },
  experts_working: {
    label: '专家执行中',
    tone: 'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)] text-[var(--theme-text-info)]',
  },
  reviewing: {
    label: '复核中',
    tone: 'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)] text-[var(--theme-text-info)]',
  },
  synthesizing: {
    label: '综合中',
    tone: 'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)] text-[var(--theme-text-info)]',
  },
  completed: {
    label: '已完成',
    tone: 'border-[var(--theme-text-success)]/30 bg-[var(--theme-bg-success)] text-[var(--theme-text-success)]',
  },
};

const stepTone: Record<ProcessNodeStatus, string> = {
  idle: 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text-tertiary)]',
  active:
    'border-[var(--theme-border-focus)] bg-[var(--theme-bg-info)] text-[var(--theme-text-info)]',
  completed:
    'border-[var(--theme-text-success)]/30 bg-[var(--theme-bg-success)] text-[var(--theme-text-success)]',
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

const ProcessTimer = ({
  start,
  end,
  appState,
}: {
  start: number | null | undefined;
  end: number | null | undefined;
  appState: AppState;
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const isRunning = appState !== 'idle' && appState !== 'completed' && !!start;

    if (isRunning && start) {
      setElapsed(Date.now() - start);
      interval = setInterval(() => {
        setElapsed(Date.now() - start);
      }, 100);
    } else if (appState === 'completed' && start && end) {
      setElapsed(end - start);
    } else if (appState === 'idle') {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [appState, start, end]);

  if (!start) return null;

  return (
    <div
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-2 font-mono text-xs font-medium text-[var(--theme-text-secondary)]"
      aria-label="过程用时"
    >
      <Clock3 size={13} className="text-[var(--theme-text-tertiary)]" aria-hidden="true" />
      {formatDuration(elapsed)}
    </div>
  );
};

const buildExpertSummary = (experts: ExpertResult[]) => {
  if (experts.length === 0) return '等待专家列表';

  const counts = experts.reduce(
    (acc, expert) => {
      acc[expert.status] += 1;
      return acc;
    },
    {
      pending: 0,
      thinking: 0,
      completed: 0,
      error: 0,
    } satisfies Record<ExpertResult['status'], number>,
  );

  const parts = [`${experts.length} 位专家`];

  if (counts.thinking) parts.push(`${counts.thinking} 进行中`);
  if (counts.pending) parts.push(`${counts.pending} 排队`);
  if (counts.completed) parts.push(`${counts.completed} 完成`);
  if (counts.error) parts.push(`${counts.error} 异常`);

  return parts.join(' · ');
};

const StatCell = ({ label, value }: { label: string; value: number }) => (
  <div className="min-w-0 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-2.5 py-2">
    <div className="text-[10px] font-medium text-[var(--theme-text-tertiary)]">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-semibold text-[var(--theme-text-primary)]">
      {value}
    </div>
  </div>
);

const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-dashed border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)]/60 px-3 py-3 text-sm text-[var(--theme-text-tertiary)]">
    {children}
  </div>
);

const ProcessFlow = ({
  appState,
  managerAnalysis,
  experts,
  defaultExpanded = true,
  processStartTime,
  processEndTime,
}: ProcessFlowProps) => {
  const hasManagerAnalysis = !!managerAnalysis;
  const hasExperts = experts.length > 0;
  const managerStatus = getManagerStatus(appState, hasManagerAnalysis);
  const rawExpertsStatus = getExpertsStatus(experts);
  const expertsStatus =
    appState === 'reviewing' && rawExpertsStatus === 'completed' ? 'active' : rawExpertsStatus;
  const synthesisStatus = getSynthesisStatus(appState);

  const [expandedSections, setExpandedSections] = useState<Record<ProcessSection, boolean>>(() => ({
    manager: defaultExpanded,
    experts: defaultExpanded && hasExperts,
    synthesis: defaultExpanded && synthesisStatus !== 'idle',
  }));

  useEffect(() => {
    setExpandedSections((current) => ({
      ...current,
      experts: current.experts || (defaultExpanded && hasExperts),
      synthesis: current.synthesis || (defaultExpanded && synthesisStatus !== 'idle'),
    }));
  }, [defaultExpanded, hasExperts, synthesisStatus]);

  const expertStats = useMemo(
    () =>
      experts.reduce(
        (acc, expert) => {
          acc[expert.status] += 1;
          return acc;
        },
        {
          pending: 0,
          thinking: 0,
          completed: 0,
          error: 0,
        } satisfies Record<ExpertResult['status'], number>,
      ),
    [experts],
  );

  const activeExpert = experts.find((expert) => expert.status === 'thinking');
  const expertSummary = buildExpertSummary(experts);
  const synthesisSummary =
    synthesisStatus === 'completed'
      ? '最终答案已完成'
      : synthesisStatus === 'active'
        ? '正在整合专家结果'
        : '等待专家结果';

  const steps = [
    { label: '规划', status: managerStatus, icon: Users },
    { label: '专家', status: expertsStatus, icon: Zap },
    { label: '综合', status: synthesisStatus, icon: Brain },
  ];

  const progressScore = steps.reduce((score, step) => {
    if (step.status === 'completed') return score + 1;
    if (step.status === 'active') return score + 0.5;
    return score;
  }, 0);
  const progressPercentage =
    appState === 'idle'
      ? 0
      : appState === 'completed'
        ? 100
        : Math.max(8, Math.min(96, Math.round((progressScore / steps.length) * 100)));

  const toggleSection = (section: ProcessSection) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] shadow-sm"
      data-testid="process-flow"
    >
      <header className="border-b border-[var(--theme-border-primary)] px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]">
                <Activity size={16} aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold text-[var(--theme-text-primary)]">推理过程</h2>
              <span
                className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${runStatus[appState].tone}`}
              >
                {runStatus[appState].label}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[var(--theme-text-tertiary)]">
              <span className="rounded-md bg-[var(--theme-bg-secondary)] px-2 py-1">
                {hasManagerAnalysis ? '规划已就绪' : '等待规划'}
              </span>
              <span className="rounded-md bg-[var(--theme-bg-secondary)] px-2 py-1">
                {expertSummary}
              </span>
              {activeExpert && (
                <span className="max-w-full truncate rounded-md bg-[var(--theme-bg-secondary)] px-2 py-1">
                  正在处理：{activeExpert.role}
                </span>
              )}
            </div>
          </div>

          <ProcessTimer start={processStartTime} end={processEndTime} appState={appState} />
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--theme-bg-tertiary)]">
          <div
            className="h-full rounded-full bg-[var(--theme-border-focus)] transition-[width] duration-500"
            style={{ width: `${progressPercentage}%` }}
            aria-hidden="true"
          />
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 border-b border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)] px-4 py-2.5">
        {steps.map((step) => {
          const StepIcon = step.icon;

          return (
            <div
              key={step.label}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium ${stepTone[step.status]}`}
            >
              <StepIcon size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="divide-y divide-[var(--theme-border-primary)]">
        <ProcessNode
          icon={Route}
          title="规划策略"
          summary={hasManagerAnalysis ? '任务拆解和专家编排完成' : '正在拆解请求'}
          status={managerStatus}
          isExpanded={expandedSections.manager}
          onToggle={() => toggleSection('manager')}
        >
          {managerAnalysis ? (
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-xs font-medium text-[var(--theme-text-tertiary)]">
                  策略摘要
                </div>
                <p className="whitespace-pre-wrap rounded-lg bg-[var(--theme-bg-secondary)] px-3 py-2.5 text-sm leading-6 text-[var(--theme-text-secondary)]">
                  {managerAnalysis.thought_process}
                </p>
              </div>

              {managerAnalysis.experts?.length > 0 && (
                <div>
                  <div className="mb-1.5 text-xs font-medium text-[var(--theme-text-tertiary)]">
                    专家编排
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {managerAnalysis.experts.map((expert, index) => (
                      <span
                        key={`${expert.role}-${index}`}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-2 py-1 text-xs font-medium text-[var(--theme-text-secondary)]"
                      >
                        <Users size={12} className="shrink-0" aria-hidden="true" />
                        <span className="truncate">{expert.role}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState>
              <span className="inline-flex items-center gap-2">
                {managerStatus === 'active' && (
                  <Loader2
                    size={14}
                    className="animate-spin text-[var(--theme-border-focus)]"
                    aria-hidden="true"
                  />
                )}
                正在准备规划信息...
              </span>
            </EmptyState>
          )}
        </ProcessNode>

        <ProcessNode
          icon={Zap}
          title="专家执行"
          summary={expertSummary}
          status={expertsStatus}
          isExpanded={expandedSections.experts}
          onToggle={() => toggleSection('experts')}
          meta={
            hasExperts ? (
              <span className="hidden font-mono text-xs text-[var(--theme-text-tertiary)] sm:inline">
                {expertStats.completed + expertStats.error}/{experts.length}
              </span>
            ) : undefined
          }
        >
          {hasExperts ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCell label="排队" value={expertStats.pending} />
                <StatCell label="进行" value={expertStats.thinking} />
                <StatCell label="完成" value={expertStats.completed} />
                <StatCell label="异常" value={expertStats.error} />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {experts.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>等待规划生成专家列表。</EmptyState>
          )}
        </ProcessNode>

        <ProcessNode
          icon={Brain}
          title="最终综合"
          summary={synthesisSummary}
          status={synthesisStatus}
          isExpanded={expandedSections.synthesis}
          onToggle={() => toggleSection('synthesis')}
        >
          <div className="rounded-lg bg-[var(--theme-bg-secondary)] px-3 py-2.5 text-sm text-[var(--theme-text-secondary)]">
            {synthesisStatus === 'active' ? (
              <span className="inline-flex items-center gap-2">
                <Loader2
                  className="animate-spin text-[var(--theme-border-focus)]"
                  size={14}
                  aria-hidden="true"
                />
                正在综合最终答案...
              </span>
            ) : synthesisStatus === 'completed' ? (
              <span className="inline-flex items-center gap-2 text-[var(--theme-text-success)]">
                <CheckCircle2 size={14} aria-hidden="true" />
                推理完成。
              </span>
            ) : (
              <span className="text-[var(--theme-text-tertiary)]">等待进入综合阶段。</span>
            )}
          </div>
        </ProcessNode>
      </div>
    </div>
  );
};

export default ProcessFlow;
