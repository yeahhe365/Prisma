import { useCallback, useRef } from 'react';
import {
  DeepThinkRuntimeBridge,
  runDynamicDeepThinkOrchestration,
} from '../services/deepThink/orchestrator';
import { RequestQueue } from '../services/utils/retry';
import type { AppConfig, ChatMessage, ModelOption } from '../types';
import { useDeepThinkState } from './useDeepThinkState';

function useExpertQueue() {
  const queueRef = useRef(new RequestQueue(3));
  const concurrencyRef = useRef(3);

  const updateConcurrency = useCallback((concurrency: number) => {
    if (concurrency !== concurrencyRef.current) {
      concurrencyRef.current = concurrency;
      queueRef.current = new RequestQueue(concurrency);
    }
  }, []);

  return { queueRef, updateConcurrency };
}

export const useDeepThink = () => {
  const { queueRef, updateConcurrency: updateQueueConcurrency } = useExpertQueue();
  const {
    appState,
    setAppState,
    managerAnalysis,
    setManagerAnalysis,
    experts,
    expertsDataRef,
    finalOutput,
    setFinalOutput,
    synthesisThoughts,
    setSynthesisThoughts,
    processStartTime,
    setProcessStartTime,
    processEndTime,
    setProcessEndTime,
    abortControllerRef,
    resetDeepThink,
    stopDeepThink,
    updateExpertAt,
    setInitialExperts,
    appendExperts,
  } = useDeepThinkState();

  const runDynamicDeepThink = useCallback(
    async (query: string, history: ChatMessage[], model: ModelOption, config: AppConfig) => {
      const bridge: DeepThinkRuntimeBridge = {
        queueRef,
        abortControllerRef,
        expertsDataRef,
        updateQueueConcurrency,
        setAppState,
        setManagerAnalysis,
        setInitialExperts,
        appendExperts,
        updateExpertAt,
        setFinalOutput,
        setSynthesisThoughts,
        setProcessStartTime,
        setProcessEndTime,
      };

      await runDynamicDeepThinkOrchestration(query, history, model, config, bridge);
    },
    [
      appendExperts,
      abortControllerRef,
      expertsDataRef,
      queueRef,
      setAppState,
      setFinalOutput,
      setInitialExperts,
      setManagerAnalysis,
      setProcessEndTime,
      setProcessStartTime,
      setSynthesisThoughts,
      updateExpertAt,
      updateQueueConcurrency,
    ],
  );

  return {
    appState,
    managerAnalysis,
    experts,
    finalOutput,
    synthesisThoughts,
    runDynamicDeepThink,
    stopDeepThink,
    resetDeepThink,
    processStartTime,
    processEndTime,
  };
};
