import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  autoCleanup,
  deleteGroup,
  deleteSession,
  getAllGroups,
  getAllSessions,
  getSession,
  migrateFromLocalStorage,
  putGroup,
  putSession,
} from '@/services/storage';
import type { ChatGroup, ChatSession } from '@/types';

const makeSession = (id: string, createdAt: number): ChatSession => ({
  id,
  title: `Session ${id}`,
  createdAt,
  model: 'gemini-3.5-flash',
  messages: [{ id: `msg-${id}`, role: 'user', content: `hello ${id}` }],
});

const makeGroup = (id: string, createdAt: number): ChatGroup => ({
  id,
  title: `Group ${id}`,
  createdAt,
  isExpanded: true,
});

const resetIndexedDb = async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('prisma-sessions');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
};

describe('storage service', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await resetIndexedDb();
  });

  afterEach(async () => {
    await resetIndexedDb();
  });

  it('stores and retrieves sessions from IndexedDB', async () => {
    const session = makeSession('alpha', 1);

    await putSession(session);

    await expect(getSession<ChatSession>('alpha')).resolves.toEqual(session);
    await expect(getAllSessions<ChatSession>()).resolves.toEqual([session]);
  });

  it('deletes sessions from IndexedDB', async () => {
    await putSession(makeSession('alpha', 1));
    await deleteSession('alpha');

    await expect(getSession<ChatSession>('alpha')).resolves.toBeUndefined();
  });

  it('stores, retrieves, and deletes groups from IndexedDB', async () => {
    const group = makeGroup('alpha', 1);

    await putGroup(group);

    await expect(getAllGroups<ChatGroup>()).resolves.toEqual([group]);

    await deleteGroup('alpha');

    await expect(getAllGroups<ChatGroup>()).resolves.toEqual([]);
  });

  it('keeps only the newest 50 sessions during cleanup', async () => {
    for (let index = 0; index < 55; index++) {
      await putSession(makeSession(`session-${index}`, index));
    }

    await autoCleanup();

    const sessions = await getAllSessions<ChatSession>();
    const ids = sessions.map((session) => session.id);

    expect(sessions).toHaveLength(50);
    expect(ids).not.toContain('session-0');
    expect(ids).not.toContain('session-4');
    expect(ids).toContain('session-54');
  });

  it('migrates legacy localStorage sessions only once', async () => {
    const legacySessions = [makeSession('legacy', 42)];
    localStorage.setItem('prisma-sessions', JSON.stringify(legacySessions));

    await migrateFromLocalStorage();
    await migrateFromLocalStorage();

    expect(localStorage.getItem('prisma-sessions')).toBeNull();
    expect(localStorage.getItem('prisma-sessions-migrated')).toBe('true');
    await expect(getAllSessions<ChatSession>()).resolves.toEqual(legacySessions);
  });

  it('marks migration complete when there is no legacy data', async () => {
    await migrateFromLocalStorage();

    expect(localStorage.getItem('prisma-sessions-migrated')).toBe('true');
    await expect(getAllSessions<ChatSession>()).resolves.toEqual([]);
  });

  it('migrates from the deepthink fallback key and removes it afterwards', async () => {
    const legacySessions = [makeSession('deepthink', 7)];
    localStorage.setItem('deepthink-sessions', JSON.stringify(legacySessions));

    await migrateFromLocalStorage();

    expect(localStorage.getItem('deepthink-sessions')).toBeNull();
    await expect(getAllSessions<ChatSession>()).resolves.toEqual(legacySessions);
  });

  it('swallows malformed legacy data and still marks migration complete', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('prisma-sessions', '{broken json');

    await migrateFromLocalStorage();

    expect(warnSpy).toHaveBeenCalled();
    expect(localStorage.getItem('prisma-sessions-migrated')).toBe('true');
    await expect(getAllSessions<ChatSession>()).resolves.toEqual([]);
  });

  it('skips cleanup when the session count is already within the limit', async () => {
    for (let index = 0; index < 3; index++) {
      await putSession(makeSession(`session-${index}`, index));
    }

    await autoCleanup();

    await expect(getAllSessions<ChatSession>()).resolves.toHaveLength(3);
  });
});
