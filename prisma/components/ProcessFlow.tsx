
import React, { useState, useEffect } from 'react';
import { Users, Zap, Brain, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { AppState, AnalysisResult, ExpertResult } from '../types';
import ProcessNode from '../ProcessNode';
import ExpertCard from '../ExpertCard';

interface ProcessFlowProps {
  appState: AppState;
  managerAnalysis: AnalysisResult | null;
  experts: ExpertResult[];
  defaultExpanded?: boolean;
  processStartTime?: number | null;
  processEndTime?: number | null;
}

const GlobalTimer = ({ start, end, appState }: { start: number | null | undefined, end: number | null | undefined, appState: AppState }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
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
    <div className="absolute right-0 top-0 flex items-center gap-1.5 bg-slate-800 text-slate-100 text-xs font-mono py-1 px-2 rounded-lg shadow-sm z-20">
      <Clock size={12} className="text-indigo-400" />
      <span>{seconds}s</span>
    </div>
  );
};

const ProcessFlow = ({ appState, managerAnalysis, experts, defaultExpanded = true, processStartTime, processEndTime }: ProcessFlowProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Status computation helpers
  const isAnalysisDone = !!managerAnalysis;
  const isSynthesisActive = appState === 'synthesizing';
  const isComplete = appState === 'completed';

  // Experts are active if ANY expert is currently thinking or pending
  const hasExperts = experts.length > 0;
  const anyExpertWorking = experts.some(e => e.status === 'thinking' || e.status === 'pending');
  const allExpertsDone = experts.length > 0 && experts.every(e => e.status === 'completed' || e.status === 'error');
  
  // Logic for Node Active States
  const managerStatus = (appState === 'analyzing' && !managerAnalysis) ? 'active' : (isAnalysisDone ? 'completed' : 'idle');
  const expertsStatus = anyExpertWorking ? 'active' : (allExpertsDone ? 'completed' : 'idle');

  return (
    <div className="relative space-y-4 pt-4 w-full">
      
      {/* Global Timer Overlay */}
      <GlobalTimer start={processStartTime} end={processEndTime} appState={appState} />

      <div className="relative space-y-2">
        {/* Connector Line */}
        <div className={`absolute left-8 top-2 bottom-2 w-0.5 bg-slate-100 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`} />

        {/* Node 1: Manager Analysis */}
        <ProcessNode 
          icon={Users} 
          title="Planning Strategy" 
          status={managerStatus}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        >
          <div className="space-y-3 pl-2">
            {managerAnalysis ? (
              <>
                <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">
                  "{managerAnalysis.thought_process}"
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {managerAnalysis.experts?.map((exp, i) => (
                    <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200 font-medium uppercase tracking-wide">
                      {exp.role}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                 <Loader2 size={14} className="animate-spin text-indigo-500" />
                 <span>Analyzing request...</span>
              </div>
            )}
          </div>
        </ProcessNode>

        {/* Node 2: Expert Pool */}
        {hasExperts && (
          <ProcessNode 
            icon={Zap} 
            title="Expert Execution" 
            status={expertsStatus}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          >
            {/* Modified: Compact Grid for Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          </ProcessNode>
        )}

        {/* Node 3: Synthesis */}
        {(isSynthesisActive || isComplete) && (
          <ProcessNode 
            icon={Brain} 
            title="Final Synthesis" 
            status={isSynthesisActive ? 'active' : (isComplete ? 'completed' : 'idle')}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          >
            <div className="text-sm text-slate-600 pl-2">
              {isSynthesisActive ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-indigo-600" size={14} />
                  <span>Synthesizing final answer...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-teal-600">
                  <CheckCircle2 size={14} />
                  <span>Reasoning complete.</span>
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
