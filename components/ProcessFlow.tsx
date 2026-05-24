import React, { useState, useEffect } from 'react';
import { Users, Zap, Brain, Loader2, CheckCircle2, Clock } from 'lucide-react';
import type { AppState, AnalysisResult, ExpertResult } from '../types';
import ProcessNode from './ProcessNode';
import ExpertCard from './ExpertCard';
import { getExpertsStatus, getManagerStatus, getSynthesisStatus } from './processFlowStatus';

interface ProcessFlowProps {
  appState: AppState;
  managerAnalysis: AnalysisResult | null;
  experts: ExpertResult[];
  defaultExpanded?: boolean;
  processStartTime?: number | null;
  processEndTime?: number | null;
}

const GlobalTimer = ({
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
    const isRunning = appState !== 'idle' && appState !== 'completed' && start;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsed(Date.now() - (start || 0));
      }, 100);
    } else if (appState === 'completed' && start && end) {
      setElapsed(end - start);
    } else if (appState === 'idle') {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [appState, start, end]);

  if (!start) return null;

  const seconds = (elapsed / 1000).toFixed(1);
  return (
    <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-2 py-1 font-mono text-xs text-[var(--theme-text-secondary)] shadow-sm">
      <Clock size={12} className="text-[var(--theme-text-tertiary)]" />
      <span>{seconds}s</span>
    </div>
  );
};

const ProcessFlow = ({
  appState,
  managerAnalysis,
  experts,
  defaultExpanded = true,
  processStartTime,
  processEndTime,
}: ProcessFlowProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasManagerAnalysis = !!managerAnalysis;
  const hasExperts = experts.length > 0;
  const managerStatus = getManagerStatus(appState, hasManagerAnalysis);
  const expertsStatus = getExpertsStatus(experts);
  const synthesisStatus = getSynthesisStatus(appState);

  return (
    <div className="relative space-y-5 pt-8 w-full">
      {/* Global Timer Overlay */}
      <GlobalTimer start={processStartTime} end={processEndTime} appState={appState} />

      <div className="relative space-y-3">
        {/* Connector Line */}
        <div
          className={`absolute bottom-2 left-8 top-2 w-0.5 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} ${hasManagerAnalysis || expertsStatus === 'active' ? 'connector-flowing' : 'bg-[var(--theme-border-primary)]'}`}
        />

        {/* Node 1: Manager Analysis */}
        <ProcessNode
          icon={Users}
          title="规划策略"
          status={managerStatus}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          glow={managerStatus === 'active'}
        >
          <div className="space-y-3 pl-2">
            {managerAnalysis ? (
              <>
                <p className="border-l-2 border-[var(--theme-border-secondary)] pl-3 text-sm italic text-[var(--theme-text-secondary)]">
                  "{managerAnalysis.thought_process}"
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {managerAnalysis.experts?.map((exp, i) => (
                    <span
                      key={i}
                      className="rounded border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--theme-text-secondary)]"
                    >
                      {exp.role}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm text-[var(--theme-text-secondary)]">
                <Loader2 size={14} className="animate-spin text-[var(--theme-border-focus)]" />
                <span>分析请求中...</span>
              </div>
            )}
          </div>
        </ProcessNode>

        {/* Node 2: Expert Pool */}
        {hasExperts && (
          <ProcessNode
            icon={Zap}
            title="专家执行"
            status={expertsStatus}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
            glow={expertsStatus === 'active'}
          >
            <div className="grid grid-cols-1 gap-5 pt-3 lg:grid-cols-2">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          </ProcessNode>
        )}

        {/* Node 3: Synthesis */}
        {synthesisStatus !== 'idle' && (
          <ProcessNode
            icon={Brain}
            title="最终综合"
            status={synthesisStatus}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
            glow={synthesisStatus === 'active'}
          >
            <div className="pl-2 text-sm text-[var(--theme-text-secondary)]">
              {synthesisStatus === 'active' ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-[var(--theme-border-focus)]" size={14} />
                  <span>综合最终答案中...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[var(--theme-text-success)]">
                  <CheckCircle2 size={14} />
                  <span>推理完成。</span>
                </div>
              )}
            </div>
          </ProcessNode>
        )}
      </div>
    </div>
  );
};

export default ProcessFlow;
