import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, ChatMessage, ModelOption, ChatGroup } from '@/types';
import {
  getAllSessions,
  getAllGroups,
  putSession,
  putGroup,
  deleteSession as deleteFromDB,
  deleteGroup as deleteGroupFromDB,
  autoCleanup,
  migrateFromLocalStorage,
} from '@/services/storage';

const createSessionTitle = (initialMessages: ChatMessage[]): string => {
  const firstMessage = initialMessages[0];
  const contentTitle = firstMessage?.content.trim();
  if (contentTitle) {
    return contentTitle.slice(0, 40) + (contentTitle.length > 40 ? '...' : '');
  }

  const attachmentNames = firstMessage?.attachments
    ?.map((attachment) => attachment.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (attachmentNames?.length) {
    const attachmentTitle = `附件：${attachmentNames.join('、')}`;
    return attachmentTitle.slice(0, 40) + (attachmentTitle.length > 40 ? '...' : '');
  }

  return '新对话';
};

const createDuplicateTitle = (title: string) => `${title || '新对话'}（副本）`;

const cloneMessagesWithFreshIds = (messages: ChatMessage[]): ChatMessage[] =>
  messages.map((message) => ({
    ...message,
    id: crypto.randomUUID(),
    attachments: message.attachments?.map((attachment) => ({
      ...attachment,
      id: crypto.randomUUID(),
    })),
    isThinking: message.isThinking ? false : message.isThinking,
  }));

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from IndexedDB on mount
  useEffect(() => {
    const init = async () => {
      await migrateFromLocalStorage();
      await autoCleanup();
      const [allSessions, allGroups] = await Promise.all([
        getAllSessions<ChatSession>(),
        getAllGroups<ChatGroup>(),
      ]);
      setSessions(allSessions);
      setGroups(allGroups.map((group) => ({ ...group, isExpanded: group.isExpanded ?? true })));
    };
    init();
  }, []);

  const getSession = useCallback(
    (id: string) => {
      return sessions.find((s) => s.id === id);
    },
    [sessions],
  );

  const createSession = useCallback((initialMessages: ChatMessage[], model: ModelOption) => {
    const newId = crypto.randomUUID();
    const title = createSessionTitle(initialMessages);

    const newSession: ChatSession = {
      id: newId,
      title,
      messages: initialMessages,
      createdAt: Date.now(),
      model,
      groupId: null,
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    putSession(newSession).catch((e) => console.error('[Storage] Failed to save session:', e));
    return newId;
  }, []);

  const updateSessionMessages = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, messages } : s));
      const session = updated.find((s) => s.id === sessionId);
      if (session) {
        putSession(session).catch((e) => console.error('[Storage] Failed to update session:', e));
      }
      return updated;
    });
  }, []);

  const renameSession = useCallback((sessionId: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    setSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId ? { ...session, title: nextTitle } : session,
      );
      const session = updated.find((item) => item.id === sessionId);
      if (session) {
        putSession(session).catch((e) => console.error('[Storage] Failed to rename session:', e));
      }
      return updated;
    });
  }, []);

  const togglePinSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId ? { ...session, isPinned: !session.isPinned } : session,
      );
      const session = updated.find((item) => item.id === sessionId);
      if (session) {
        putSession(session).catch((e) =>
          console.error('[Storage] Failed to toggle session pin:', e),
        );
      }
      return updated;
    });
  }, []);

  const duplicateSession = useCallback((sessionId: string) => {
    let newSessionId: string | null = null;

    setSessions((prev) => {
      const session = prev.find((item) => item.id === sessionId);
      if (!session) return prev;

      const duplicate: ChatSession = {
        ...session,
        id: crypto.randomUUID(),
        title: createDuplicateTitle(session.title),
        messages: cloneMessagesWithFreshIds(session.messages),
        createdAt: Date.now(),
        groupId: null,
        isPinned: false,
      };

      newSessionId = duplicate.id;
      putSession(duplicate).catch((e) =>
        console.error('[Storage] Failed to duplicate session:', e),
      );
      return [duplicate, ...prev];
    });

    return newSessionId;
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      deleteFromDB(id).catch((e) => console.error('[Storage] Failed to delete session:', e));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    },
    [currentSessionId],
  );

  const createGroup = useCallback(() => {
    const newGroup: ChatGroup = {
      id: `group-${crypto.randomUUID()}`,
      title: '新分组',
      createdAt: Date.now(),
      isExpanded: true,
    };

    setGroups((prev) => [newGroup, ...prev]);
    putGroup(newGroup).catch((e) => console.error('[Storage] Failed to save group:', e));
    return newGroup.id;
  }, []);

  const renameGroup = useCallback((groupId: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    setGroups((prev) => {
      const updated = prev.map((group) =>
        group.id === groupId ? { ...group, title: nextTitle } : group,
      );
      const group = updated.find((item) => item.id === groupId);
      if (group) {
        putGroup(group).catch((e) => console.error('[Storage] Failed to rename group:', e));
      }
      return updated;
    });
  }, []);

  const toggleGroupExpansion = useCallback((groupId: string) => {
    setGroups((prev) => {
      const updated = prev.map((group) =>
        group.id === groupId ? { ...group, isExpanded: !(group.isExpanded ?? true) } : group,
      );
      const group = updated.find((item) => item.id === groupId);
      if (group) {
        putGroup(group).catch((e) =>
          console.error('[Storage] Failed to update group expansion:', e),
        );
      }
      return updated;
    });
  }, []);

  const moveSessionToGroup = useCallback((sessionId: string, groupId: string | null) => {
    setSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId ? { ...session, groupId } : session,
      );
      const session = updated.find((item) => item.id === sessionId);
      if (session) {
        putSession(session).catch((e) =>
          console.error('[Storage] Failed to move session to group:', e),
        );
      }
      return updated;
    });
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSessions((prev) => {
      const affectedSessions = prev
        .filter((session) => session.groupId === groupId)
        .map((session) => ({ ...session, groupId: null }));
      const updated = prev.map((session) =>
        session.groupId === groupId ? { ...session, groupId: null } : session,
      );
      affectedSessions.forEach((session) => {
        putSession(session).catch((e) =>
          console.error('[Storage] Failed to ungroup session after group deletion:', e),
        );
      });
      return updated;
    });
    deleteGroupFromDB(groupId).catch((e) => console.error('[Storage] Failed to delete group:', e));
  }, []);

  return {
    sessions,
    groups,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    updateSessionMessages,
    renameSession,
    togglePinSession,
    duplicateSession,
    deleteSession,
    createGroup,
    deleteGroup,
    renameGroup,
    moveSessionToGroup,
    toggleGroupExpansion,
    getSession,
  };
};
