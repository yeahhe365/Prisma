import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import type { ChatMessage, MessageAttachment, ThinkingLevel } from '@/types';
import { getInitialSelectedModel, setModelPreference, STORAGE_KEYS } from '@/config';
import { resolveModelApiConfig } from '@/api';
import { getUnsupportedOpenAIAttachments } from '@/services/deepThink/contentBuilder';
import { useDeepThink } from '@/hooks/useDeepThink';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useChatMessageActions } from '@/hooks/useChatMessageActions';
import { useLatestRef } from '@/hooks/useLatestRef';
import { useStoredConfig } from '@/hooks/useStoredConfig';

const getInitialSidebarOpen = () => {
  const storedValue = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);

  if (storedValue === 'true') return true;
  if (storedValue === 'false') return false;

  return window.innerWidth >= 1024;
};

export const useAppLogic = () => {
  // Session Management
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    updateSessionMessages,
    deleteSession,
    getSession,
  } = useChatSessions();

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarOpen);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [inputError, setInputError] = useState<string | null>(null);
  const hasHydratedSidebarPreferenceRef = useRef(false);
  const cachedSessionIdRef = useRef(localStorage.getItem(STORAGE_KEYS.SESSION_ID));

  // Active Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const messagesRef = useLatestRef(messages);

  const { config, setConfig, selectedModel, setSelectedModel, effectiveConfig } = useStoredConfig();

  // Deep Think Engine
  const {
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
  } = useDeepThink();

  // Persistence Effects
  useEffect(() => {
    setInputError(null);
  }, [selectedModel]);

  useEffect(() => {
    if (!hasHydratedSidebarPreferenceRef.current) {
      hasHydratedSidebarPreferenceRef.current = true;
      return;
    }

    localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const cachedSessionId = cachedSessionIdRef.current;
    if (cachedSessionId && sessions.some((s) => s.id === cachedSessionId)) {
      setCurrentSessionId(cachedSessionId);
      cachedSessionIdRef.current = null;
    }
  }, [sessions, setCurrentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, currentSessionId);
    }
  }, [currentSessionId]);

  // Sync Messages when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      const session = getSession(currentSessionId);
      if (session) {
        setMessages(session.messages);
        setSelectedModel(getInitialSelectedModel(session.model || null, config));
      }
    } else {
      setMessages([]);
    }
  }, [config, currentSessionId, getSession, setSelectedModel]);

  // Refs for stable access inside effects
  const finalOutputRef = useLatestRef(finalOutput);
  const managerAnalysisRef = useLatestRef(managerAnalysis);
  const expertsRef = useLatestRef(experts);
  const synthesisThoughtsRef = useLatestRef(synthesisThoughts);
  const processStartTimeRef = useLatestRef(processStartTime);
  const processEndTimeRef = useLatestRef(processEndTime);
  const selectedModelRef = useLatestRef(selectedModel);
  const currentSessionIdRef = useLatestRef(currentSessionId);

  const syncMessagesToActiveSession = useCallback(
    (nextMessages: ChatMessage[]) => {
      messagesRef.current = nextMessages;
      setMessages(nextMessages);

      const sid = currentSessionIdRef.current;
      if (sid) {
        updateSessionMessages(sid, nextMessages);
      }
    },
    [currentSessionIdRef, messagesRef, updateSessionMessages],
  );

  // Handle AI Completion — triggered only by appState
  useEffect(() => {
    if (appState !== 'completed') return;

    const finalizedMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'model',
      content: finalOutputRef.current,
      analysis: managerAnalysisRef.current,
      experts: expertsRef.current,
      synthesisThoughts: synthesisThoughtsRef.current,
      isThinking: false,
      totalDuration:
        processStartTimeRef.current && processEndTimeRef.current
          ? processEndTimeRef.current - processStartTimeRef.current
          : undefined,
    };

    const newMessages = [...messagesRef.current, finalizedMessage];
    setMessages(newMessages);

    const sid = currentSessionIdRef.current;
    if (sid) {
      updateSessionMessages(sid, newMessages);
    } else if (selectedModelRef.current) {
      createSession(newMessages, selectedModelRef.current);
    }

    resetDeepThink();
    setFocusTrigger((prev) => prev + 1);
  }, [
    appState,
    createSession,
    currentSessionIdRef,
    expertsRef,
    finalOutputRef,
    managerAnalysisRef,
    messagesRef,
    processEndTimeRef,
    processStartTimeRef,
    resetDeepThink,
    selectedModelRef,
    synthesisThoughtsRef,
    updateSessionMessages,
  ]);

  // Update a per-model thinking setting
  const handleSetThinkingLevel = useCallback(
    (key: 'planningLevel' | 'expertLevel' | 'synthesisLevel', value: ThinkingLevel) => {
      if (!selectedModel) return;
      setConfig((prev) => setModelPreference(prev, selectedModel, { [key]: value }));
    },
    [selectedModel, setConfig],
  );

  // Update per-model recursive loop toggle
  const handleSetRecursiveLoop = useCallback(
    (value: boolean) => {
      if (!selectedModel) return;
      setConfig((prev) => setModelPreference(prev, selectedModel, { enableRecursiveLoop: value }));
    },
    [selectedModel, setConfig],
  );

  const clearInputError = useCallback(() => {
    setInputError(null);
  }, []);

  const handleRun = useCallback(
    (attachments: MessageAttachment[] = []) => {
      if (!query.trim() && attachments.length === 0) return false;
      if (!selectedModel) {
        setInputError('请先在设置中添加并选择一个模型。');
        return false;
      }

      const provider = resolveModelApiConfig(selectedModel, config).provider;
      const unsupportedOpenAIAttachments =
        provider === 'openai' ? getUnsupportedOpenAIAttachments(attachments) : [];

      if (unsupportedOpenAIAttachments.length > 0) {
        const attachmentNames = unsupportedOpenAIAttachments
          .map((att) => att.name || att.type)
          .join('、');
        setInputError(`当前模型仅支持图片和文本/代码附件，无法发送：${attachmentNames}`);
        return false;
      }

      setInputError(null);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        attachments: attachments,
      };

      const currentMessages = messagesRef.current;
      const newMessages = [...currentMessages, userMsg];
      setMessages(newMessages);

      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        activeSessionId = createSession(newMessages, selectedModel);
      } else {
        updateSessionMessages(activeSessionId, newMessages);
      }

      runDynamicDeepThink(query, newMessages, selectedModel, effectiveConfig);
      setQuery('');
      return true;
    },
    [
      query,
      currentSessionId,
      selectedModel,
      config,
      effectiveConfig,
      createSession,
      messagesRef,
      updateSessionMessages,
      runDynamicDeepThink,
    ],
  );

  const {
    handleDeleteMessage,
    handleEditMessage,
    handleRetryMessage,
    handleContinueGeneration,
    handleForkMessage,
  } = useChatMessageActions({
    selectedModel,
    effectiveConfig,
    messagesRef,
    syncMessagesToActiveSession,
    setInputError,
    setQuery,
    setFocusTrigger,
    stopDeepThink,
    resetDeepThink,
    runDynamicDeepThink,
  });

  const handleNewChat = useCallback(() => {
    stopDeepThink();
    setCurrentSessionId(null);
    setMessages([]);
    setQuery('');
    setInputError(null);
    resetDeepThink();
    cachedSessionIdRef.current = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    setFocusTrigger((prev) => prev + 1);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [stopDeepThink, setCurrentSessionId, resetDeepThink]);

  const handleSelectSession = useCallback(
    (id: string) => {
      stopDeepThink();
      resetDeepThink();
      setCurrentSessionId(id);
      setInputError(null);
      setFocusTrigger((prev) => prev + 1);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    },
    [stopDeepThink, resetDeepThink, setCurrentSessionId],
  );

  const handleDeleteSession = useCallback(
    (id: string, e: MouseEvent) => {
      e.stopPropagation();
      deleteSession(id);
      if (currentSessionId === id) {
        handleNewChat();
      }
    },
    [deleteSession, currentSessionId, handleNewChat],
  );

  return {
    sessions,
    currentSessionId,
    messages,
    query,
    setQuery,
    selectedModel,
    setSelectedModel,
    config,
    setConfig,
    effectiveConfig,
    isSidebarOpen,
    setIsSidebarOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    appState,
    managerAnalysis,
    experts,
    finalOutput,
    processStartTime,
    processEndTime,
    handleRun,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
    stopDeepThink,
    focusTrigger,
    inputError,
    clearInputError,
    handleSetThinkingLevel,
    handleSetRecursiveLoop,
    handleEditMessage,
    handleDeleteMessage,
    handleRetryMessage,
    handleContinueGeneration,
    handleForkMessage,
  };
};
