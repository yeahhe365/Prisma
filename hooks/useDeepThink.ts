import { useCallback, useRef } from 'react';
import { getAI, getAIProvider, findCustomModel } from '../api';
import { getThinkingBudget } from '../config';
import { AppConfig, ModelOption, ExpertResult, ChatMessage, MessageAttachment, AIClient } from '../types';

import { executeManagerAnalysis, executeManagerReview } from '../services/deepThink/manager';
import { streamExpertResponse } from '../services/deepThink/expert';
import { streamSynthesisResponse } from '../services/deepThink/synthesis';
import { RequestQueue } from '../services/utils/retry';
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
    ai: AIClient,
    model: ModelOption,
    context: string,
    attachments: MessageAttachment[],
    budget: number,
    thinkingLevel: string,
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
        attachments,
        budget,
        thinkingLevel,
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

    } catch (error: unknown) {
       console.error(`Expert ${expert.role} error:`, error);
       if (!signal.aborted) {
           const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : "An unexpected error occurred.");
           updateExpertAt(globalIndex, { 
             status: 'error', 
             content: `**Error:** ${errorMessage}\n\nPlease check your API Key and connection settings in Configuration.`, 
             endTime: Date.now() 
           });
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
    if (!query.trim() && (!history.length || !history[history.length - 1].attachments?.length)) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Reset UI state
    setAppState('analyzing');
    updateQueueConcurrency(config.expertConcurrency || 3);
    setManagerAnalysis(null);
    setInitialExperts([]);
    setFinalOutput('');
    setSynthesisThoughts('');
    setProcessStartTime(Date.now());
    setProcessEndTime(null);
    
    const customModelConfig = findCustomModel(model, config.customModels);
    const provider = customModelConfig?.provider || getAIProvider(model);

    const ai = getAI({
      provider,
      apiKey: customModelConfig?.apiKey || config.customApiKey,
      baseUrl: customModelConfig?.baseUrl || config.customBaseUrl
    });

    const planningBudget = getThinkingBudget(config.planningLevel, model);
    const expertBudget = getThinkingBudget(config.expertLevel, model);
    const synthesisBudget = getThinkingBudget(config.synthesisLevel, model);

    try {
      // Get the last message (which is the user's current query) to retrieve attachments
      const lastMessage = history[history.length - 1];
      const currentAttachments = lastMessage.role === 'user' ? (lastMessage.attachments || []) : [];

      const recentHistory = history.slice(0, -1).slice(-5).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}`
      ).join('\n');

      // --- Phase 1: Planning & Initial Experts ---
      
      const managerTask = executeManagerAnalysis(
        ai, 
        model, 
        query, 
        recentHistory,
        currentAttachments,
        planningBudget,
        config.expertLevel
      ).catch(e => {
        console.error("Manager Analysis failure:", e);
        return {
          thought_process: `Analysis failed: ${e.message || "Unknown error"}. Proceeding with primary responder only.`,
          experts: []
        };
      });

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
        primaryExpert, 0, ai, model, recentHistory, currentAttachments,
        expertBudget, config.expertLevel, signal
      );

      const analysisJson = await managerTask;
      if (signal.aborted) return;
      setManagerAnalysis(analysisJson);

      const round1Experts: ExpertResult[] = (analysisJson.experts || []).slice(0, 6).map((exp, idx) => ({
        ...exp,
        id: `expert-r1-${idx + 1}`,
        status: 'pending',
        round: 1
      }));

      if (round1Experts.length > 0) {
        appendExperts(round1Experts);
      }
      setAppState('experts_working');

      const round1Tasks = round1Experts.map((exp, idx) => 
        queueRef.current.add(() => runExpertLifecycle(exp, idx + 1, ai, model, recentHistory, currentAttachments,
           expertBudget, config.expertLevel, signal))
      );

      await Promise.all([primaryTask, ...round1Tasks]);
      if (signal.aborted) return;

      // --- Phase 2: Recursive Loop (Optional) ---
      let roundCounter = 1;
      const MAX_ROUNDS = 2;
      let loopActive = (config.enableRecursiveLoop ?? false) && round1Experts.length > 0;

      while (loopActive && roundCounter < MAX_ROUNDS) {
          if (signal.aborted) return;
          setAppState('reviewing');
          
          try {
            const reviewResult = await executeManagerReview(
              ai, model, query, expertsDataRef.current,
              planningBudget,
              config.expertLevel
            );

            if (signal.aborted) return;
            if (reviewResult.satisfied) {
              loopActive = false;
            } else {
               roundCounter++;
               const nextRoundExperts = (reviewResult.refined_experts || []).slice(0, 6).map((exp, idx) => ({
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
                  queueRef.current.add(() => runExpertLifecycle(exp, startIndex + idx, ai, model, recentHistory, currentAttachments,
                     expertBudget, config.expertLevel, signal))
               );

               await Promise.all(nextRoundTasks);
            }
          } catch (reviewError) {
            console.error("Review round error:", reviewError);
            loopActive = false;
          }
      }

      if (signal.aborted) return;

      // --- Phase 3: Synthesis ---
      setAppState('synthesizing');

      let fullFinalText = '';
      let fullFinalThoughts = '';

      try {
        await streamSynthesisResponse(
          ai, model, query, recentHistory, expertsDataRef.current,
          currentAttachments,
          synthesisBudget,
          config.synthesisLevel,
          signal,
          (textChunk, thoughtChunk) => {
              fullFinalText += textChunk;
              fullFinalThoughts += thoughtChunk;
              setFinalOutput(fullFinalText);
              setSynthesisThoughts(fullFinalThoughts);
          }
        );
      } catch (synthesisError: unknown) {
        console.error("Synthesis error:", synthesisError);
        if (!fullFinalText) {
          const msg = synthesisError instanceof Error ? synthesisError.message : "Failed to aggregate expert responses.";
          setFinalOutput(`## Error in Synthesis\n\n${msg}\n\nPlease check your API keys and try again.`);
        }
      }

      if (!signal.aborted) {
        setAppState('completed');
        setProcessEndTime(Date.now());
      }

    } catch (e: unknown) {
      if (!signal.aborted) {
        console.error("Global DeepThink Error:", e);
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
