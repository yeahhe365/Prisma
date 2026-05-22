import React, { useState, useEffect } from 'react';
import { Users, Zap, Brain, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { AppState, AnalysisResult, ExpertResult } from '../types';
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
    <div className="absolute right-0 top-0 flex items-center gap-1.5 bg-slate-800 text-slate-100 text-xs font-mono py-1 px-2 rounded-lg shadow-sm">
      <Clock size={12} className="text-blue-400" />
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
          className={`absolute left-8 top-2 bottom-2 w-0.5 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} ${hasManagerAnalysis || expertsStatus === 'active' ? 'connector-flowing' : 'bg-slate-100'}`}
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
                <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">
                  "{managerAnalysis.thought_process}"
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {managerAnalysis.experts?.map((exp, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200 font-medium uppercase tracking-wide"
                    >
                      {exp.role}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <Loader2 size={14} className="animate-spin text-blue-500" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3">
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
            <div className="text-sm text-slate-600 pl-2">
              {synthesisStatus === 'active' ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-purple-600" size={14} />
                  <span>综合最终答案中...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
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
