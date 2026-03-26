import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ModelOption, AppConfig, ChatMessage, MessageAttachment, ThinkingLevel } from '../types';
import { STORAGE_KEYS, DEFAULT_CONFIG, getValidThinkingLevels, getEffectiveConfig, setModelPreference } from '../config';
import { useDeepThink } from './useDeepThink';
import { useChatSessions } from './useChatSessions';

export const useAppLogic = () => {
  // Session Management
  const { 
    sessions, 
    currentSessionId, 
    setCurrentSessionId,
    createSession, 
    updateSessionMessages, 
    deleteSession,
    getSession
  } = useChatSessions();

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Active Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // App Configuration with Persistence
  const [selectedModel, setSelectedModel] = useState<ModelOption>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.MODEL);
    return (cached as ModelOption) || 'glm-5-turbo';
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (cached) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

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
    processEndTime
  } = useDeepThink();

  // Effective config: per-model preferences override global defaults
  const effectiveConfig = useMemo(
    () => getEffectiveConfig(selectedModel, config),
    [selectedModel, config]
  );

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODEL, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    const cachedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (cachedSessionId && sessions.some(s => s.id === cachedSessionId)) {
      setCurrentSessionId(cachedSessionId);
    }
  }, [sessions, setCurrentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, currentSessionId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    }
  }, [currentSessionId]);

  // Sync Messages when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      const session = getSession(currentSessionId);
      if (session) {
        setMessages(session.messages);
        setSelectedModel(session.model || 'gemini-3-flash-preview');
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId, getSession]);

  // Refs for stable access inside effects
  const finalOutputRef = useRef(finalOutput);
  finalOutputRef.current = finalOutput;
  const managerAnalysisRef = useRef(managerAnalysis);
  managerAnalysisRef.current = managerAnalysis;
  const expertsRef = useRef(experts);
  expertsRef.current = experts;
  const synthesisThoughtsRef = useRef(synthesisThoughts);
  synthesisThoughtsRef.current = synthesisThoughts;
  const processStartTimeRef = useRef(processStartTime);
  processStartTimeRef.current = processStartTime;
  const processEndTimeRef = useRef(processEndTime);
  processEndTimeRef.current = processEndTime;
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;
  const currentSessionIdRef = useRef(currentSessionId);
  currentSessionIdRef.current = currentSessionId;

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
      totalDuration: (processStartTimeRef.current && processEndTimeRef.current)
        ? (processEndTimeRef.current - processStartTimeRef.current)
        : undefined
    };

    const newMessages = [...messagesRef.current, finalizedMessage];
    setMessages(newMessages);

    const sid = currentSessionIdRef.current;
    if (sid) {
      updateSessionMessages(sid, newMessages);
    } else {
      createSession(newMessages, selectedModelRef.current);
    }

    resetDeepThink();
    setFocusTrigger(prev => prev + 1);
  }, [appState, resetDeepThink, createSession, updateSessionMessages]);

  // Update a per-model thinking setting
  const handleSetThinkingLevel = useCallback((key: 'planningLevel' | 'expertLevel' | 'synthesisLevel', value: ThinkingLevel) => {
    setConfig(prev => setModelPreference(prev, selectedModel, { [key]: value }));
  }, [selectedModel]);

  // Update per-model recursive loop toggle
  const handleSetRecursiveLoop = useCallback((value: boolean) => {
    setConfig(prev => setModelPreference(prev, selectedModel, { enableRecursiveLoop: value }));
  }, [selectedModel]);

  const handleRun = useCallback((attachments: MessageAttachment[] = []) => {
    if (!query.trim() && attachments.length === 0) return;
    
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      attachments: attachments
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
  }, [query, currentSessionId, selectedModel, effectiveConfig, createSession, updateSessionMessages, runDynamicDeepThink]);

  const handleNewChat = useCallback(() => {
    stopDeepThink();
    setCurrentSessionId(null);
    setMessages([]);
    setQuery('');
    resetDeepThink();
    setFocusTrigger(prev => prev + 1);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [stopDeepThink, setCurrentSessionId, resetDeepThink]);

  const handleSelectSession = useCallback((id: string) => {
    stopDeepThink();
    resetDeepThink();
    setCurrentSessionId(id);
    setFocusTrigger(prev => prev + 1);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [stopDeepThink, resetDeepThink, setCurrentSessionId]);

  const handleDeleteSession = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    if (currentSessionId === id) {
      handleNewChat();
    }
  }, [deleteSession, currentSessionId, handleNewChat]);

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
    handleSetThinkingLevel,
    handleSetRecursiveLoop,
  };
};
