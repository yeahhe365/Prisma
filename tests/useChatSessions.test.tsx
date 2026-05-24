import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  getAllSessions: vi.fn(),
  putSession: vi.fn(),
  deleteSession: vi.fn(),
  autoCleanup: vi.fn(),
  migrateFromLocalStorage: vi.fn(),
}));

vi.mock('../services/storage', () => ({
  getAllSessions: storageMocks.getAllSessions,
  putSession: storageMocks.putSession,
  deleteSession: storageMocks.deleteSession,
  autoCleanup: storageMocks.autoCleanup,
  migrateFromLocalStorage: storageMocks.migrateFromLocalStorage,
}));

import { useChatSessions } from '../hooks/useChatSessions';
import type { ChatSession } from '../types';

const existingSession: ChatSession = {
  id: 'existing',
  title: 'Existing chat',
  createdAt: 1,
  model: 'gemini-3.5-flash',
  messages: [{ id: 'm1', role: 'user', content: 'hello' }],
};

describe('useChatSessions', () => {
  beforeEach(() => {
    storageMocks.getAllSessions.mockReset().mockResolvedValue([existingSession]);
    storageMocks.putSession.mockReset().mockResolvedValue(undefined);
    storageMocks.deleteSession.mockReset().mockResolvedValue(undefined);
    storageMocks.autoCleanup.mockReset().mockResolvedValue(undefined);
    storageMocks.migrateFromLocalStorage.mockReset().mockResolvedValue(undefined);
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      'generated-id-0000-0000-0000-000000000000' as `${string}-${string}-${string}-${string}-${string}`,
    );
    vi.spyOn(Date, 'now').mockReturnValue(123456);
  });

  it('loads persisted sessions on mount', async () => {
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([existingSession]);
    });

    expect(storageMocks.migrateFromLocalStorage).toHaveBeenCalled();
    expect(storageMocks.autoCleanup).toHaveBeenCalled();
  });

  it('creates sessions with truncated titles and persists them', async () => {
    storageMocks.getAllSessions.mockResolvedValue([]);
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(storageMocks.autoCleanup).toHaveBeenCalled();
    });

    act(() => {
      result.current.createSession(
        [
          {
            id: 'u1',
            role: 'user',
            content: 'This is a very long prompt that should be truncated in the title',
          },
        ],
        'gemini-3.5-flash',
      );
    });

    expect(result.current.currentSessionId).toBe('generated-id-0000-0000-0000-000000000000');
    expect(result.current.sessions[0]).toMatchObject({
      id: 'generated-id-0000-0000-0000-000000000000',
      title: 'This is a very long prompt that should b...',
      createdAt: 123456,
    });
    expect(storageMocks.putSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-id-0000-0000-0000-000000000000',
        title: 'This is a very long prompt that should b...',
      }),
    );
  });

  it('updates and deletes sessions while keeping helper accessors in sync', async () => {
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([existingSession]);
    });

    act(() => {
      result.current.setCurrentSessionId('existing');
      result.current.updateSessionMessages('existing', [
        { id: 'm1', role: 'user', content: 'updated' },
        { id: 'm2', role: 'model', content: 'answer' },
      ]);
    });

    expect(result.current.getSession('existing')?.messages).toHaveLength(2);
    expect(storageMocks.putSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'existing',
        messages: expect.arrayContaining([
          expect.objectContaining({ content: 'updated' }),
          expect.objectContaining({ content: 'answer' }),
        ]),
      }),
    );

    act(() => {
      result.current.deleteSession('existing');
    });

    expect(storageMocks.deleteSession).toHaveBeenCalledWith('existing');
    expect(result.current.sessions).toEqual([]);
    expect(result.current.currentSessionId).toBeNull();

    expect(result.current.currentSessionId).toBeNull();
  });

  it('keeps the public hook API limited to app-facing session operations', async () => {
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([existingSession]);
    });

    expect(result.current).not.toHaveProperty('clearCurrentSession');
    expect(result.current).not.toHaveProperty('loaded');
  });

  it('skips persistence updates when the target session does not exist and keeps non-current deletions isolated', async () => {
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([existingSession]);
    });

    act(() => {
      result.current.setCurrentSessionId('existing');
      result.current.updateSessionMessages('missing', [
        { id: 'm3', role: 'user', content: 'ignored' },
      ]);
    });

    expect(storageMocks.putSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'missing' }),
    );
    expect(result.current.currentSessionId).toBe('existing');

    act(() => {
      result.current.deleteSession('another-session');
    });

    expect(result.current.currentSessionId).toBe('existing');
  });

  it('logs persistence failures for save, update, and delete paths', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    storageMocks.putSession.mockRejectedValue(new Error('put failed'));
    storageMocks.deleteSession.mockRejectedValue(new Error('delete failed'));

    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([existingSession]);
    });

    act(() => {
      result.current.createSession(
        [{ id: 'u1', role: 'user', content: 'short title' }],
        'gemini-3.5-flash',
      );
      result.current.updateSessionMessages('existing', [
        { id: 'm1', role: 'user', content: 'updated' },
      ]);
      result.current.deleteSession('existing');
    });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledTimes(3);
    });
  });
});
