import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage, ModelOption } from '../types';
import { getAllSessions, putSession, deleteSession as deleteFromDB, autoCleanup, migrateFromLocalStorage } from '../services/storage';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load sessions from IndexedDB on mount
  useEffect(() => {
    const init = async () => {
      await migrateFromLocalStorage();
      const allSessions = await getAllSessions<ChatSession>();
      setSessions(allSessions);
      setLoaded(true);
      await autoCleanup();
    };
    init();
  }, []);

  const getSession = useCallback((id: string) => {
    return sessions.find(s => s.id === id);
  }, [sessions]);

  const createSession = useCallback((initialMessages: ChatMessage[], model: ModelOption) => {
    const newId = crypto.randomUUID();
    const title = initialMessages[0].content.slice(0, 40) + (initialMessages[0].content.length > 40 ? '...' : '');

    const newSession: ChatSession = {
      id: newId,
      title,
      messages: initialMessages,
      createdAt: Date.now(),
      model,
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    putSession(newSession).catch(e => console.error('[Storage] Failed to save session:', e));
    return newId;
  }, []);

  const updateSessionMessages = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === sessionId ? { ...s, messages } : s
      );
      const session = updated.find(s => s.id === sessionId);
      if (session) {
        putSession(session).catch(e => console.error('[Storage] Failed to update session:', e));
      }
      return updated;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    deleteFromDB(id).catch(e => console.error('[Storage] Failed to delete session:', e));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const clearCurrentSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    updateSessionMessages,
    deleteSession,
    clearCurrentSession,
    getSession,
    loaded,
  };
};
