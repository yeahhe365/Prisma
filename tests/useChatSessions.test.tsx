import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  getAllSessions: vi.fn(),
  getAllGroups: vi.fn(),
  putSession: vi.fn(),
  putGroup: vi.fn(),
  deleteSession: vi.fn(),
  deleteGroup: vi.fn(),
  autoCleanup: vi.fn(),
  migrateFromLocalStorage: vi.fn(),
}));

vi.mock('@/services/storage', () => ({
  getAllSessions: storageMocks.getAllSessions,
  getAllGroups: storageMocks.getAllGroups,
  putSession: storageMocks.putSession,
  putGroup: storageMocks.putGroup,
  deleteSession: storageMocks.deleteSession,
  deleteGroup: storageMocks.deleteGroup,
  autoCleanup: storageMocks.autoCleanup,
  migrateFromLocalStorage: storageMocks.migrateFromLocalStorage,
}));

import { useChatSessions } from '@/hooks/useChatSessions';
import type { ChatGroup, ChatSession } from '@/types';

const existingSession: ChatSession = {
  id: 'existing',
  title: 'Existing chat',
  createdAt: 1,
  model: 'gemini-3.5-flash',
  messages: [{ id: 'm1', role: 'user', content: 'hello' }],
};

const existingGroup: ChatGroup = {
  id: 'group-1',
  title: 'Work',
  createdAt: 2,
};

describe('useChatSessions', () => {
  beforeEach(() => {
    storageMocks.getAllSessions.mockReset().mockResolvedValue([existingSession]);
    storageMocks.getAllGroups.mockReset().mockResolvedValue([]);
    storageMocks.putSession.mockReset().mockResolvedValue(undefined);
    storageMocks.putGroup.mockReset().mockResolvedValue(undefined);
    storageMocks.deleteSession.mockReset().mockResolvedValue(undefined);
    storageMocks.deleteGroup.mockReset().mockResolvedValue(undefined);
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
    expect(storageMocks.autoCleanup.mock.invocationCallOrder[0]).toBeLessThan(
      storageMocks.getAllSessions.mock.invocationCallOrder[0],
    );
    expect(storageMocks.getAllGroups).toHaveBeenCalled();
  });

  it('loads persisted groups and defaults their expanded state', async () => {
    storageMocks.getAllGroups.mockResolvedValue([existingGroup]);
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.groups).toEqual([{ ...existingGroup, isExpanded: true }]);
    });
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
      groupId: null,
    });
    expect(storageMocks.putSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-id-0000-0000-0000-000000000000',
        title: 'This is a very long prompt that should b...',
      }),
    );
  });

  it('uses attachment names for session titles when the first prompt has no text', async () => {
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
            content: '',
            attachments: [
              {
                id: 'att-1',
                type: 'image',
                name: 'diagram.png',
                mimeType: 'image/png',
                data: 'ZmFrZQ==',
              },
            ],
          },
        ],
        'gemini-3.5-flash',
      );
    });

    expect(result.current.sessions[0]).toMatchObject({
      title: '附件：diagram.png',
    });
    expect(storageMocks.putSession).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '附件：diagram.png',
      }),
    );
  });

  it('uses a fallback title when the first prompt has neither text nor named attachments', async () => {
    storageMocks.getAllSessions.mockResolvedValue([]);
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(storageMocks.autoCleanup).toHaveBeenCalled();
    });

    act(() => {
      result.current.createSession([{ id: 'u1', role: 'user', content: '' }], 'gemini-3.5-flash');
    });

    expect(result.current.sessions[0]).toMatchObject({
      title: '新对话',
    });
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

  it('renames, pins, and duplicates sessions with AMC-style persistence', async () => {
    storageMocks.getAllSessions.mockResolvedValue([
      {
        ...existingSession,
        groupId: 'group-1',
        isPinned: true,
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'hello',
            attachments: [
              {
                id: 'att-1',
                type: 'image',
                name: 'diagram.png',
                mimeType: 'image/png',
                data: 'ZmFrZQ==',
              },
            ],
          },
        ],
      },
    ]);
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
    });

    act(() => {
      result.current.renameSession('existing', '  Renamed chat  ');
    });

    expect(result.current.sessions[0]).toMatchObject({
      id: 'existing',
      title: 'Renamed chat',
      isPinned: true,
      groupId: 'group-1',
    });
    expect(storageMocks.putSession).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'existing',
        title: 'Renamed chat',
      }),
    );

    act(() => {
      result.current.togglePinSession('existing');
    });

    expect(result.current.sessions[0]).toMatchObject({
      id: 'existing',
      isPinned: false,
    });
    expect(storageMocks.putSession).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'existing',
        isPinned: false,
      }),
    );

    act(() => {
      result.current.duplicateSession('existing');
    });

    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.sessions[0]).toMatchObject({
      id: 'generated-id-0000-0000-0000-000000000000',
      title: 'Renamed chat（副本）',
      groupId: null,
      isPinned: false,
      createdAt: 123456,
    });
    expect(result.current.sessions[0].messages[0].id).toBe(
      'generated-id-0000-0000-0000-000000000000',
    );
    expect(result.current.sessions[0].messages[0].attachments?.[0].id).toBe(
      'generated-id-0000-0000-0000-000000000000',
    );
    expect(storageMocks.putSession).toHaveBeenLastCalledWith(result.current.sessions[0]);
  });

  it('keeps the public hook API limited to app-facing session operations', async () => {
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([existingSession]);
    });

    expect(result.current).not.toHaveProperty('clearCurrentSession');
    expect(result.current).not.toHaveProperty('loaded');
  });

  it('creates, renames, and toggles persisted chat groups', async () => {
    storageMocks.getAllGroups.mockResolvedValue([]);
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.groups).toEqual([]);
    });

    act(() => {
      result.current.createGroup();
    });

    const createdGroup = {
      id: 'group-generated-id-0000-0000-0000-000000000000',
      title: '新分组',
      createdAt: 123456,
      isExpanded: true,
    };

    expect(result.current.groups[0]).toEqual(createdGroup);
    expect(storageMocks.putGroup).toHaveBeenCalledWith(createdGroup);

    act(() => {
      result.current.renameGroup(createdGroup.id, '  Ideas  ');
    });

    expect(result.current.groups[0]).toEqual({ ...createdGroup, title: 'Ideas' });
    expect(storageMocks.putGroup).toHaveBeenLastCalledWith({ ...createdGroup, title: 'Ideas' });

    act(() => {
      result.current.toggleGroupExpansion(createdGroup.id);
    });

    expect(result.current.groups[0]).toEqual({
      ...createdGroup,
      title: 'Ideas',
      isExpanded: false,
    });
    expect(storageMocks.putGroup).toHaveBeenLastCalledWith({
      ...createdGroup,
      title: 'Ideas',
      isExpanded: false,
    });
  });

  it('moves sessions into groups and ungroups them when a group is deleted', async () => {
    storageMocks.getAllGroups.mockResolvedValue([{ ...existingGroup, isExpanded: true }]);
    const { result } = renderHook(() => useChatSessions());

    await waitFor(() => {
      expect(result.current.sessions).toEqual([existingSession]);
      expect(result.current.groups).toEqual([{ ...existingGroup, isExpanded: true }]);
    });

    act(() => {
      result.current.moveSessionToGroup('existing', 'group-1');
    });

    expect(result.current.sessions[0]).toEqual({ ...existingSession, groupId: 'group-1' });
    expect(storageMocks.putSession).toHaveBeenCalledWith({
      ...existingSession,
      groupId: 'group-1',
    });

    act(() => {
      result.current.deleteGroup('group-1');
    });

    expect(result.current.groups).toEqual([]);
    expect(result.current.sessions[0]).toEqual({ ...existingSession, groupId: null });
    expect(storageMocks.deleteGroup).toHaveBeenCalledWith('group-1');
    expect(storageMocks.putSession).toHaveBeenLastCalledWith({
      ...existingSession,
      groupId: null,
    });
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
