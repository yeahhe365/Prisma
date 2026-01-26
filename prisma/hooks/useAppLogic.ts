
import { useState, useEffect, useCallback } from 'react';
import { ModelOption, AppConfig, ChatMessage, MessageAttachment } from '../types';
import { STORAGE_KEYS, DEFAULT_CONFIG, getValidThinkingLevels } from '../config';
import { useDeepThink } from './useDeepThink';
import { useChatSessions } from './useChatSessions';
import { setNetworkConfig } from '../api';

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
  const [focusTrigger, setFocusTrigger] = useState(0); // Trigger for input focus

  // Active Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');

  // App Configuration with Persistence
  const [selectedModel, setSelectedModel] = useState<ModelOption>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.MODEL);
    return (cached as ModelOption) || 'gemini-3-flash-preview';
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

  // Network Interceptor Sync
  useEffect(() => {
    const shouldUseCustom = config.enableCustomApi;
    const customUrl = config.customBaseUrl || null;
    const provider = config.apiProvider || null;

    if (shouldUseCustom && customUrl) {
      setNetworkConfig(customUrl, provider);
    } else {
      setNetworkConfig(null, null);
    }
    
    // Also handle dynamic clean up when component unmounts
    return () => setNetworkConfig(null, null);
  }, [config.enableCustomApi, config.customBaseUrl, config.apiProvider]);

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

  // Handle Model Constraints
  useEffect(() => {
    const validLevels = getValidThinkingLevels(selectedModel);
    setConfig(prev => {
      const newPlanning = validLevels.includes(prev.planningLevel) ? prev.planningLevel : 'low';
      const newExpert = validLevels.includes(prev.expertLevel) ? prev.expertLevel : 'low';
      const newSynthesis = validLevels.includes(prev.synthesisLevel) ? prev.synthesisLevel : 'high';
      
      if (newPlanning !== prev.planningLevel || newExpert !== prev.expertLevel || newSynthesis !== prev.synthesisLevel) {
        return {
          ...prev,
          planningLevel: newPlanning as any,
          expertLevel: newExpert as any,
          synthesisLevel: newSynthesis as any,
        };
      }
      return prev;
    });
  }, [selectedModel]);

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

  // Handle AI Completion
  useEffect(() => {
    if (appState === 'completed') {
      const finalizedMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: finalOutput,
        analysis: managerAnalysis,
        experts: experts,
        synthesisThoughts: synthesisThoughts,
        isThinking: false,
        totalDuration: (processStartTime && processEndTime) ? (processEndTime - processStartTime) : undefined
      };
      
      const newMessages = [...messages, finalizedMessage];
      setMessages(newMessages);

      if (currentSessionId) {
        updateSessionMessages(currentSessionId, newMessages);
      } else {
        createSession(newMessages, selectedModel);
      }

      resetDeepThink();
      // Refocus after completion
      setFocusTrigger(prev => prev + 1);
    }
  }, [appState, finalOutput, managerAnalysis, experts, synthesisThoughts, resetDeepThink, processStartTime, processEndTime, currentSessionId, messages, selectedModel, createSession, updateSessionMessages]);

  const handleRun = useCallback((attachments: MessageAttachment[] = []) => {
    if (!query.trim() && attachments.length === 0) return;
    
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      attachments: attachments
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages); 
    
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = createSession(newMessages, selectedModel);
    } else {
      updateSessionMessages(activeSessionId, newMessages);
    }

    runDynamicDeepThink(query, newMessages, selectedModel, config);
    setQuery('');
  }, [query, messages, currentSessionId, selectedModel, config, createSession, updateSessionMessages, runDynamicDeepThink]);

  const handleNewChat = useCallback(() => {
    stopDeepThink();
    setCurrentSessionId(null);
    setMessages([]);
    setQuery('');
    resetDeepThink();
    setFocusTrigger(prev => prev + 1); // Trigger focus
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [stopDeepThink, setCurrentSessionId, resetDeepThink]);

  const handleSelectSession = useCallback((id: string) => {
    stopDeepThink();
    resetDeepThink();
    setCurrentSessionId(id);
    setFocusTrigger(prev => prev + 1); // Trigger focus
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
    focusTrigger
  };
};
