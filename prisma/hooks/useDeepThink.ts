
import { useCallback } from 'react';
import { getAI, getAIProvider, findCustomModel } from '../api';
import { getThinkingBudget } from '../config';
import { AppConfig, ModelOption, ExpertResult, ChatMessage, MessageAttachment } from '../types';

import { executeManagerAnalysis, executeManagerReview } from '../services/deepThink/manager';
import { streamExpertResponse } from '../services/deepThink/expert';
import { streamSynthesisResponse } from '../services/deepThink/synthesis';
import { useDeepThinkState } from './useDeepThinkState';
import { logger } from '../services/logger';

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
    attachments: MessageAttachment[],
    budget: number,
    signal: AbortSignal
  ): Promise<ExpertResult> => {
    if (signal.aborted) return expert;

    logger.info('Expert', `Starting expert: ${expert.role}`, { id: expert.id, round: expert.round });
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
        signal,
        (textChunk, thoughtChunk) => {
          fullContent += textChunk;
          fullThoughts += thoughtChunk;
          updateExpertAt(globalIndex, { thoughts: fullThoughts, content: fullContent });
        }
      );
      
      if (signal.aborted) {
         logger.warn('Expert', `Expert aborted: ${expert.role}`);
         return expertsDataRef.current[globalIndex];
      }

      logger.info('Expert', `Expert completed: ${expert.role}`);
      updateExpertAt(globalIndex, { status: 'completed', endTime: Date.now() });
      return expertsDataRef.current[globalIndex];

    } catch (error) {
       console.error(`Expert ${expert.role} error:`, error);
       logger.error('Expert', `Expert failed: ${expert.role}`, error);
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
    if (!query.trim() && (!history.length || !history[history.length - 1].attachments?.length)) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    logger.info('System', 'Starting DeepThink Process', { model, provider: getAIProvider(model) });

    // Reset UI state
    setAppState('analyzing');
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

    try {
      // Get the last message (which is the user's current query) to retrieve attachments
      const lastMessage = history[history.length - 1];
      const currentAttachments = lastMessage.role === 'user' ? (lastMessage.attachments || []) : [];

      const recentHistory = history.slice(0, -1).slice(-5).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}`
      ).join('\n');

      // --- Phase 1: Planning & Initial Experts ---
      logger.debug('Manager', 'Phase 1: Planning started');
      
      const managerTask = executeManagerAnalysis(
        ai, 
        model, 
        query, 
        recentHistory,
        currentAttachments,
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

      // Primary expert sees the images
      const primaryTask = runExpertLifecycle(
        primaryExpert, 0, ai, model, recentHistory, currentAttachments,
        getThinkingBudget(config.expertLevel, model), signal
      );

      const analysisJson = await managerTask;
      if (signal.aborted) return;
      setManagerAnalysis(analysisJson);
      logger.info('Manager', 'Plan generated', analysisJson);

      const round1Experts: ExpertResult[] = analysisJson.experts.map((exp, idx) => ({
        ...exp,
        id: `expert-r1-${idx + 1}`,
        status: 'pending',
        round: 1
      }));

      appendExperts(round1Experts);
      setAppState('experts_working');

      // Supplementary experts usually don't need the images unless specified, 
      // but for simplicity/consistency we pass them if the model supports it.
      // However, to save tokens/bandwidth, we might limit this.
      // For now, let's pass them to ensure they have full context.
      const round1Tasks = round1Experts.map((exp, idx) => 
        runExpertLifecycle(exp, idx + 1, ai, model, recentHistory, currentAttachments,
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
          logger.info('Manager', `Phase 2: Reviewing Round ${roundCounter}`);
          setAppState('reviewing');
          
          const reviewResult = await executeManagerReview(
            ai, model, query, expertsDataRef.current,
            getThinkingBudget(config.planningLevel, model)
          );

          if (signal.aborted) return;
          
          logger.info('Manager', `Review Result: ${reviewResult.satisfied ? 'Satisfied' : 'Not Satisfied'}`, reviewResult);
          
          if (reviewResult.satisfied) {
            loopActive = false;
          } else {
             roundCounter++;
             const nextRoundExperts = (reviewResult.refined_experts || []).map((exp, idx) => ({
                ...exp, id: `expert-r${roundCounter}-${idx}`, status: 'pending' as const, round: roundCounter
             }));

             if (nextRoundExperts.length === 0) {
                 logger.warn('Manager', 'Not satisfied but no new experts proposed. Breaking loop.');
                 loopActive = false;
                 break;
             }

             const startIndex = expertsDataRef.current.length;
             appendExperts(nextRoundExperts);
             setAppState('experts_working');

             const nextRoundTasks = nextRoundExperts.map((exp, idx) => 
                runExpertLifecycle(exp, startIndex + idx, ai, model, recentHistory, currentAttachments,
                   getThinkingBudget(config.expertLevel, model), signal)
             );

             await Promise.all(nextRoundTasks);
          }
      }

      if (signal.aborted) return;

      // --- Phase 3: Synthesis ---
      setAppState('synthesizing');
      logger.info('Synthesis', 'Phase 3: Synthesis started');

      let fullFinalText = '';
      let fullFinalThoughts = '';

      await streamSynthesisResponse(
        ai, model, query, recentHistory, expertsDataRef.current,
        currentAttachments,
        getThinkingBudget(config.synthesisLevel, model), signal,
        (textChunk, thoughtChunk) => {
            fullFinalText += textChunk;
            fullFinalThoughts += thoughtChunk;
            setFinalOutput(fullFinalText);
            setSynthesisThoughts(fullFinalThoughts);
        }
      );

      if (!signal.aborted) {
        logger.info('Synthesis', 'Response generation completed');
        setAppState('completed');
        setProcessEndTime(Date.now());
      }

    } catch (e: any) {
      if (!signal.aborted) {
        console.error(e);
        logger.error('System', 'DeepThink Process Error', e);
        setAppState('idle');
        setProcessEndTime(Date.now());
      } else {
        logger.warn('System', 'Process aborted by user');
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
