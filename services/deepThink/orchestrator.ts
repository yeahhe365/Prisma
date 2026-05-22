import { findCustomModel, getAI, getAIProvider } from '../../api';
import { getThinkingBudget } from '../../config';
import {
  AIClient,
  AnalysisResult,
  AppConfig,
  AppState,
  ChatMessage,
  ExpertResult,
  MessageAttachment,
  ModelOption,
  ThinkingLevel,
} from '../../types';
import { RequestQueue } from '../utils/retry';
import { streamExpertResponse } from './expert';
import { executeManagerAnalysis, executeManagerReview } from './manager';
import { streamSynthesisResponse } from './synthesis';

type Ref<T> = {
  current: T;
};

export interface DeepThinkRuntimeBridge {
  queueRef: Ref<RequestQueue>;
  abortControllerRef: Ref<AbortController | null>;
  expertsDataRef: Ref<ExpertResult[]>;
  updateQueueConcurrency: (concurrency: number) => void;
  setAppState: (state: AppState) => void;
  setManagerAnalysis: (analysis: AnalysisResult | null) => void;
  setInitialExperts: (experts: ExpertResult[]) => void;
  appendExperts: (experts: ExpertResult[]) => void;
  updateExpertAt: (
    index: number,
    update: Partial<ExpertResult> | ((prev: ExpertResult) => ExpertResult),
  ) => void;
  setFinalOutput: (output: string) => void;
  setSynthesisThoughts: (thoughts: string) => void;
  setProcessStartTime: (time: number | null) => void;
  setProcessEndTime: (time: number | null) => void;
}

const MAX_EXPERTS_PER_ROUND = 6;
const MAX_ROUNDS = 2;

const getRecentHistory = (history: ChatMessage[]): string => {
  return history
    .slice(0, -1)
    .slice(-5)
    .map((message) => `${message.role === 'user' ? 'User' : 'Model'}: ${message.content}`)
    .join('\n');
};

const getCurrentAttachments = (history: ChatMessage[]): MessageAttachment[] => {
  const lastMessage = history[history.length - 1];
  return lastMessage?.role === 'user' ? lastMessage.attachments || [] : [];
};

const createPrimaryExpert = (query: string): ExpertResult => ({
  id: 'expert-0',
  role: 'Primary Responder',
  description: "Directly addresses the user's original query.",
  temperature: 1,
  prompt: query,
  status: 'pending',
  round: 1,
});

const toRoundExperts = (
  experts: AnalysisResult['experts'],
  round: number,
  idPrefix: string,
): ExpertResult[] => {
  return (experts || []).slice(0, MAX_EXPERTS_PER_ROUND).map((expert, index) => ({
    ...expert,
    id: `${idPrefix}-${index + 1}`,
    status: 'pending',
    round,
  }));
};

const getAIClient = (model: ModelOption, config: AppConfig): AIClient => {
  const customModelConfig = findCustomModel(model, config.customModels);
  const provider = customModelConfig?.provider || getAIProvider(model);
  const apiConfig = {
    provider,
    ...(customModelConfig?.apiKey ? { apiKey: customModelConfig.apiKey } : {}),
    ...(customModelConfig?.baseUrl ? { baseUrl: customModelConfig.baseUrl } : {}),
  };

  return getAI(apiConfig);
};

const runExpertLifecycle = async (
  bridge: DeepThinkRuntimeBridge,
  expert: ExpertResult,
  globalIndex: number,
  ai: AIClient,
  model: ModelOption,
  context: string,
  attachments: MessageAttachment[],
  budget: number,
  thinkingLevel: ThinkingLevel,
  signal: AbortSignal,
): Promise<ExpertResult> => {
  if (signal.aborted) return expert;

  bridge.updateExpertAt(globalIndex, { status: 'thinking', startTime: Date.now() });

  try {
    let fullContent = '';
    let fullThoughts = '';

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
        bridge.updateExpertAt(globalIndex, { thoughts: fullThoughts, content: fullContent });
      },
    );

    if (signal.aborted) return bridge.expertsDataRef.current[globalIndex];

    bridge.updateExpertAt(globalIndex, { status: 'completed', endTime: Date.now() });
    return bridge.expertsDataRef.current[globalIndex];
  } catch (error: unknown) {
    console.error(`Expert ${expert.role} error:`, error);

    if (!signal.aborted) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'An unexpected error occurred.';

      bridge.updateExpertAt(globalIndex, {
        status: 'error',
        content: `**Error:** ${errorMessage}\n\nPlease check your API Key and connection settings in Configuration.`,
        endTime: Date.now(),
      });
    }

    return bridge.expertsDataRef.current[globalIndex];
  }
};

export const runDynamicDeepThinkOrchestration = async (
  query: string,
  history: ChatMessage[],
  model: ModelOption,
  config: AppConfig,
  bridge: DeepThinkRuntimeBridge,
) => {
  if (!query.trim() && (!history.length || !history[history.length - 1].attachments?.length))
    return;

  if (bridge.abortControllerRef.current) bridge.abortControllerRef.current.abort();
  bridge.abortControllerRef.current = new AbortController();
  const signal = bridge.abortControllerRef.current.signal;

  bridge.setAppState('analyzing');
  bridge.updateQueueConcurrency(config.expertConcurrency || 3);
  bridge.setManagerAnalysis(null);
  bridge.setInitialExperts([]);
  bridge.setFinalOutput('');
  bridge.setSynthesisThoughts('');
  bridge.setProcessStartTime(Date.now());
  bridge.setProcessEndTime(null);

  try {
    const ai = getAIClient(model, config);
    const planningBudget = getThinkingBudget(config.planningLevel, model);
    const expertBudget = getThinkingBudget(config.expertLevel, model);
    const synthesisBudget = getThinkingBudget(config.synthesisLevel, model);
    const currentAttachments = getCurrentAttachments(history);
    const recentHistory = getRecentHistory(history);

    const managerTask = executeManagerAnalysis(
      ai,
      model,
      query,
      recentHistory,
      currentAttachments,
      planningBudget,
      config.expertLevel,
    ).catch((error) => {
      console.error('Manager Analysis failure:', error);
      return {
        thought_process: `Analysis failed: ${error.message || 'Unknown error'}. Proceeding with primary responder only.`,
        experts: [],
      };
    });

    const primaryExpert = createPrimaryExpert(query);
    bridge.setInitialExperts([primaryExpert]);

    const primaryTask = runExpertLifecycle(
      bridge,
      primaryExpert,
      0,
      ai,
      model,
      recentHistory,
      currentAttachments,
      expertBudget,
      config.expertLevel,
      signal,
    );

    const analysisJson = await managerTask;
    if (signal.aborted) return;
    bridge.setManagerAnalysis(analysisJson);

    const round1Experts = toRoundExperts(analysisJson.experts, 1, 'expert-r1');
    if (round1Experts.length > 0) {
      bridge.appendExperts(round1Experts);
    }

    bridge.setAppState('experts_working');

    const round1Tasks = round1Experts.map((expert, index) =>
      bridge.queueRef.current.add(() =>
        runExpertLifecycle(
          bridge,
          expert,
          index + 1,
          ai,
          model,
          recentHistory,
          currentAttachments,
          expertBudget,
          config.expertLevel,
          signal,
        ),
      ),
    );

    await Promise.all([primaryTask, ...round1Tasks]);
    if (signal.aborted) return;

    let roundCounter = 1;
    let loopActive = (config.enableRecursiveLoop ?? false) && round1Experts.length > 0;

    while (loopActive && roundCounter < MAX_ROUNDS) {
      if (signal.aborted) return;
      bridge.setAppState('reviewing');

      try {
        const reviewResult = await executeManagerReview(
          ai,
          model,
          query,
          bridge.expertsDataRef.current,
          planningBudget,
          config.expertLevel,
        );

        if (signal.aborted) return;

        if (reviewResult.satisfied) {
          loopActive = false;
        } else {
          roundCounter++;
          const nextRoundExperts = toRoundExperts(
            reviewResult.refined_experts || [],
            roundCounter,
            `expert-r${roundCounter}`,
          );

          if (nextRoundExperts.length === 0) {
            loopActive = false;
            break;
          }

          const startIndex = bridge.expertsDataRef.current.length;
          bridge.appendExperts(nextRoundExperts);
          bridge.setAppState('experts_working');

          const nextRoundTasks = nextRoundExperts.map((expert, index) =>
            bridge.queueRef.current.add(() =>
              runExpertLifecycle(
                bridge,
                expert,
                startIndex + index,
                ai,
                model,
                recentHistory,
                currentAttachments,
                expertBudget,
                config.expertLevel,
                signal,
              ),
            ),
          );

          await Promise.all(nextRoundTasks);
        }
      } catch (reviewError) {
        console.error('Review round error:', reviewError);
        loopActive = false;
      }
    }

    if (signal.aborted) return;

    bridge.setAppState('synthesizing');

    let fullFinalText = '';
    let fullFinalThoughts = '';

    try {
      await streamSynthesisResponse(
        ai,
        model,
        query,
        recentHistory,
        bridge.expertsDataRef.current,
        currentAttachments,
        synthesisBudget,
        config.synthesisLevel,
        signal,
        (textChunk, thoughtChunk) => {
          fullFinalText += textChunk;
          fullFinalThoughts += thoughtChunk;
          bridge.setFinalOutput(fullFinalText);
          bridge.setSynthesisThoughts(fullFinalThoughts);
        },
      );
    } catch (synthesisError: unknown) {
      console.error('Synthesis error:', synthesisError);
      if (!fullFinalText) {
        const message =
          synthesisError instanceof Error
            ? synthesisError.message
            : 'Failed to aggregate expert responses.';
        bridge.setFinalOutput(
          `## Error in Synthesis\n\n${message}\n\nPlease check your API keys and try again.`,
        );
      }
    }

    if (!signal.aborted) {
      bridge.setAppState('completed');
      bridge.setProcessEndTime(Date.now());
    }
  } catch (error: unknown) {
    if (!signal.aborted) {
      console.error('Global DeepThink Error:', error);
      bridge.setAppState('idle');
      bridge.setProcessEndTime(Date.now());
    }
  } finally {
    bridge.abortControllerRef.current = null;
  }
};
