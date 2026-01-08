
import { useCallback } from 'react';
import { getAI } from '../api';
import { getThinkingBudget } from '../config';
import { AppConfig, ModelOption, ExpertResult, ChatMessage } from '../types';

import { executeManagerAnalysis, executeManagerReview } from '../services/deepThink/manager';
import { streamExpertResponse } from '../services/deepThink/expert';
import { streamSynthesisResponse } from '../services/deepThink/synthesis';
import { useDeepThinkState } from './useDeepThinkState';

export const useDeepThink = () => {
  const {
    appState, setAppState,
    managerAnalysis, setManagerAnalysis,
    experts, expertsDataRef,
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
  } = useDeepThinkState();

  /**
   * Orchestrates a single expert's lifecycle (Start -> Stream -> End)
   */
  const runExpertLifecycle = async (
    expert: ExpertResult,
    globalIndex: number,
    ai: any,
    model: ModelOption,
    context: string,
    budget: number,
    signal: AbortSignal
  ): Promise<ExpertResult> => {
    if (signal.aborted) return expert;

    const startTime = Date.now();
    updateExpertAt(globalIndex, { status: 'thinking', startTime });

    try {
      let fullContent = "";
      let fullThoughts = "";

      await streamExpertResponse(
        ai,
        model,
        expert,
        context,
        budget,
        signal,
        (textChunk, thoughtChunk) => {
          fullContent += textChunk;
          fullThoughts += thoughtChunk;
          updateExpertAt(globalIndex, { thoughts: fullThoughts, content: fullContent });
        }
      );
      
      if (signal.aborted) return expertsDataRef.current[globalIndex];

      updateExpertAt(globalIndex, { status: 'completed', endTime: Date.now() });
      return expertsDataRef.current[globalIndex];

    } catch (error) {
       console.error(`Expert ${expert.role} error:`, error);
       if (!signal.aborted) {
           updateExpertAt(globalIndex, { status: 'error', content: "Failed to generate response.", endTime: Date.now() });
       }
       return expertsDataRef.current[globalIndex];
    }
  };

  /**
   * Main Orchestration logic
   */
  const runDynamicDeepThink = async (
    query: string, 
    history: ChatMessage[],
    model: ModelOption, 
    config: AppConfig
  ) => {
    if (!query.trim()) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Reset UI state
    setAppState('analyzing');
    setManagerAnalysis(null);
    setInitialExperts([]);
    setFinalOutput('');
    setSynthesisThoughts('');
    setProcessStartTime(Date.now());
    setProcessEndTime(null);
    
    const ai = getAI({
      apiKey: config.enableCustomApi ? config.customApiKey : undefined,
      baseUrl: (config.enableCustomApi && config.customBaseUrl) ? config.customBaseUrl : undefined
    });

    try {
      const recentHistory = history.slice(-5).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}`
      ).join('\n');

      // --- Phase 1: Planning & Initial Experts ---
      
      const managerTask = executeManagerAnalysis(
        ai, 
        model, 
        query, 
        recentHistory, 
        getThinkingBudget(config.planningLevel, model)
      );

      const primaryExpert: ExpertResult = {
        id: 'expert-0',
        role: "Primary Responder",
        description: "Directly addresses the user's original query.",
        temperature: 1, 
        prompt: query, 
        status: 'pending',
        round: 1
      };

      setInitialExperts([primaryExpert]);

      const primaryTask = runExpertLifecycle(
        primaryExpert, 0, ai, model, recentHistory,
        getThinkingBudget(config.expertLevel, model), signal
      );

      const analysisJson = await managerTask;
      if (signal.aborted) return;
      setManagerAnalysis(analysisJson);

      const round1Experts: ExpertResult[] = analysisJson.experts.map((exp, idx) => ({
        ...exp,
        id: `expert-r1-${idx + 1}`,
        status: 'pending',
        round: 1
      }));

      appendExperts(round1Experts);
      setAppState('experts_working');

      const round1Tasks = round1Experts.map((exp, idx) => 
        runExpertLifecycle(exp, idx + 1, ai, model, recentHistory,
           getThinkingBudget(config.expertLevel, model), signal)
      );

      await Promise.all([primaryTask, ...round1Tasks]);
      if (signal.aborted) return;

      // --- Phase 2: Recursive Loop (Optional) ---
      let roundCounter = 1;
      const MAX_ROUNDS = 3;
      let loopActive = config.enableRecursiveLoop ?? false;

      while (loopActive && roundCounter < MAX_ROUNDS) {
          if (signal.aborted) return;
          setAppState('reviewing');
          
          const reviewResult = await executeManagerReview(
            ai, model, query, expertsDataRef.current,
            getThinkingBudget(config.planningLevel, model)
          );

          if (signal.aborted) return;
          if (reviewResult.satisfied) {
            loopActive = false;
          } else {
             roundCounter++;
             const nextRoundExperts = (reviewResult.refined_experts || []).map((exp, idx) => ({
                ...exp, id: `expert-r${roundCounter}-${idx}`, status: 'pending' as const, round: roundCounter
             }));

             if (nextRoundExperts.length === 0) {
                 loopActive = false;
                 break;
             }

             const startIndex = expertsDataRef.current.length;
             appendExperts(nextRoundExperts);
             setAppState('experts_working');

             const nextRoundTasks = nextRoundExperts.map((exp, idx) => 
                runExpertLifecycle(exp, startIndex + idx, ai, model, recentHistory,
                   getThinkingBudget(config.expertLevel, model), signal)
             );

             await Promise.all(nextRoundTasks);
          }
      }

      if (signal.aborted) return;

      // --- Phase 3: Synthesis ---
      setAppState('synthesizing');

      let fullFinalText = '';
      let fullFinalThoughts = '';

      await streamSynthesisResponse(
        ai, model, query, recentHistory, expertsDataRef.current,
        getThinkingBudget(config.synthesisLevel, model), signal,
        (textChunk, thoughtChunk) => {
            fullFinalText += textChunk;
            fullFinalThoughts += thoughtChunk;
            setFinalOutput(fullFinalText);
            setSynthesisThoughts(fullFinalThoughts);
        }
      );

      if (!signal.aborted) {
        setAppState('completed');
        setProcessEndTime(Date.now());
      }

    } catch (e: any) {
      if (!signal.aborted) {
        console.error(e);
        setAppState('idle');
        setProcessEndTime(Date.now());
      }
    } finally {
       abortControllerRef.current = null;
    }
  };

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
    processEndTime
  };
};
