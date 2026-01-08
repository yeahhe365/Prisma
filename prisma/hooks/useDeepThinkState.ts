
import { useState, useRef, useCallback } from 'react';
import { AppState, AnalysisResult, ExpertResult } from '../types';

export const useDeepThinkState = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [managerAnalysis, setManagerAnalysis] = useState<AnalysisResult | null>(null);
  const [experts, setExperts] = useState<ExpertResult[]>([]);
  const [finalOutput, setFinalOutput] = useState('');
  const [synthesisThoughts, setSynthesisThoughts] = useState('');
  
  // Timing state
  const [processStartTime, setProcessStartTime] = useState<number | null>(null);
  const [processEndTime, setProcessEndTime] = useState<number | null>(null);

  // Refs for data consistency
  const expertsDataRef = useRef<ExpertResult[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetDeepThink = useCallback(() => {
    setAppState('idle');
    setManagerAnalysis(null);
    setExperts([]);
    expertsDataRef.current = [];
    setFinalOutput('');
    setSynthesisThoughts('');
    setProcessStartTime(null);
    setProcessEndTime(null);
    abortControllerRef.current = null;
  }, []);

  const stopDeepThink = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAppState('idle');
    setProcessEndTime(Date.now());
  }, []);

  const updateExpertAt = useCallback((index: number, update: Partial<ExpertResult> | ((prev: ExpertResult) => ExpertResult)) => {
    const current = expertsDataRef.current[index];
    const next = typeof update === 'function' ? update(current) : { ...current, ...update };
    expertsDataRef.current[index] = next;
    setExperts([...expertsDataRef.current]);
  }, []);

  const setInitialExperts = useCallback((initialList: ExpertResult[]) => {
    expertsDataRef.current = initialList;
    setExperts(initialList);
  }, []);

  const appendExperts = useCallback((newList: ExpertResult[]) => {
    expertsDataRef.current = [...expertsDataRef.current, ...newList];
    setExperts([...expertsDataRef.current]);
  }, []);

  return {
    appState, setAppState,
    managerAnalysis, setManagerAnalysis,
    experts, setExperts, expertsDataRef,
    finalOutput, setFinalOutput,
    synthesisThoughts, setSynthesisThoughts,
    processStartTime, setProcessStartTime,
    processEndTime, setProcessEndTime,
    abortControllerRef,
    resetDeepThink,
    stopDeepThink,
    updateExpertAt,
    setInitialExperts,
    appendExperts
  };
};
