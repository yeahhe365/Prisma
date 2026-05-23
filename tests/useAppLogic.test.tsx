import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppConfig, ChatMessage, ChatSession, ExpertResult } from '../types';

const chatSessionsMock = vi.hoisted(() => ({
  sessions: [] as ChatSession[],
  currentSessionId: null as string | null,
  setCurrentSessionId: vi.fn<(id: string | null) => void>(),
  createSession: vi.fn<(messages: ChatMessage[], model: string) => string>(),
  updateSessionMessages: vi.fn<(id: string, messages: ChatMessage[]) => void>(),
  deleteSession: vi.fn<(id: string) => void>(),
  getSession: vi.fn<(id: string) => ChatSession | undefined>(),
}));

const deepThinkMock = vi.hoisted(() => ({
  appState: 'idle' as 'idle' | 'completed',
  managerAnalysis: null as { thought_process: string; experts: Omit<ExpertResult, 'id'>[] } | null,
  experts: [] as ExpertResult[],
  finalOutput: '',
  synthesisThoughts: '',
  runDynamicDeepThink: vi.fn(),
  stopDeepThink: vi.fn(),
  resetDeepThink: vi.fn(),
  processStartTime: null as number | null,
  processEndTime: null as number | null,
}));

vi.mock('../hooks/useChatSessions', () => ({
  useChatSessions: () => ({
    sessions: chatSessionsMock.sessions,
    currentSessionId: chatSessionsMock.currentSessionId,
    setCurrentSessionId: chatSessionsMock.setCurrentSessionId,
    createSession: chatSessionsMock.createSession,
    updateSessionMessages: chatSessionsMock.updateSessionMessages,
    deleteSession: chatSessionsMock.deleteSession,
    getSession: chatSessionsMock.getSession,
  }),
}));

vi.mock('../hooks/useDeepThink', () => ({
  useDeepThink: () => ({
    appState: deepThinkMock.appState,
    managerAnalysis: deepThinkMock.managerAnalysis,
    experts: deepThinkMock.experts,
    finalOutput: deepThinkMock.finalOutput,
    synthesisThoughts: deepThinkMock.synthesisThoughts,
    runDynamicDeepThink: deepThinkMock.runDynamicDeepThink,
    stopDeepThink: deepThinkMock.stopDeepThink,
    resetDeepThink: deepThinkMock.resetDeepThink,
    processStartTime: deepThinkMock.processStartTime,
    processEndTime: deepThinkMock.processEndTime,
  }),
}));

import { DEFAULT_CONFIG } from '../config';
import { useAppLogic } from '../hooks/useAppLogic';

const baseConfig: AppConfig = {
  ...DEFAULT_CONFIG,
  customModels: [{ id: 'glm-1', name: 'glm-5-turbo', displayName: 'GLM 5', provider: 'openai' }],
};

const session: ChatSession = {
  id: 'session-1',
  title: 'Saved chat',
  createdAt: 1,
  model: 'glm-5-turbo',
  messages: [{ id: 'saved-user', role: 'user', content: 'saved prompt' }],
};

describe('useAppLogic', () => {
  beforeEach(() => {
    localStorage.clear();
    chatSessionsMock.sessions = [];
    chatSessionsMock.currentSessionId = null;
    chatSessionsMock.setCurrentSessionId.mockReset().mockImplementation((id) => {
      chatSessionsMock.currentSessionId = id;
    });
    chatSessionsMock.createSession.mockReset().mockReturnValue('created-session');
    chatSessionsMock.updateSessionMessages.mockReset();
    chatSessionsMock.deleteSession.mockReset();
    chatSessionsMock.getSession
      .mockReset()
      .mockImplementation((id) => chatSessionsMock.sessions.find((entry) => entry.id === id));

    deepThinkMock.appState = 'idle';
    deepThinkMock.managerAnalysis = null;
    deepThinkMock.experts = [];
    deepThinkMock.finalOutput = '';
    deepThinkMock.synthesisThoughts = '';
    deepThinkMock.runDynamicDeepThink.mockReset();
    deepThinkMock.stopDeepThink.mockReset();
    deepThinkMock.resetDeepThink.mockReset();
    deepThinkMock.processStartTime = null;
    deepThinkMock.processEndTime = null;

    vi.spyOn(Date, 'now').mockReturnValue(2000);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
  });

  it('loads the selected session and model from session state', async () => {
    chatSessionsMock.sessions = [session];
    chatSessionsMock.currentSessionId = 'session-1';

    const { result } = renderHook(() => useAppLogic());

    await waitFor(() => {
      expect(result.current.messages).toEqual(session.messages);
      expect(result.current.selectedModel).toBe('glm-5-turbo');
    });
  });

  it('keeps the sidebar open by default on desktop and closed by default on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    const desktop = renderHook(() => useAppLogic());

    expect(desktop.result.current.isSidebarOpen).toBe(true);

    desktop.unmount();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 640 });
    const mobile = renderHook(() => useAppLogic());

    expect(mobile.result.current.isSidebarOpen).toBe(false);
  });

  it('blocks unsupported attachments for openai-compatible models', async () => {
    localStorage.setItem('prisma-selected-model', 'glm-5-turbo');
    localStorage.setItem('prisma-settings', JSON.stringify(baseConfig));

    const { result } = renderHook(() => useAppLogic());

    act(() => {
      result.current.setQuery('read this');
    });

    let didRun = true;
    act(() => {
      didRun = result.current.handleRun([
        {
          id: 'pdf-1',
          type: 'pdf',
          mimeType: 'application/pdf',
          data: 'fake',
          name: 'paper.pdf',
        },
      ]);
    });

    expect(didRun).toBe(false);
    expect(result.current.inputError).toContain('paper.pdf');
    expect(chatSessionsMock.createSession).not.toHaveBeenCalled();
    expect(deepThinkMock.runDynamicDeepThink).not.toHaveBeenCalled();
  });

  it('creates a new session and starts deep thinking for successful runs', async () => {
    localStorage.setItem('prisma-settings', JSON.stringify(baseConfig));
    const { result } = renderHook(() => useAppLogic());

    act(() => {
      result.current.setQuery('hello world');
    });

    let didRun = false;
    act(() => {
      didRun = result.current.handleRun();
    });

    expect(didRun).toBe(true);
    expect(chatSessionsMock.createSession).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          role: 'user',
          content: 'hello world',
        }),
      ],
      'gemini-3-flash-preview',
    );
    expect(deepThinkMock.runDynamicDeepThink).toHaveBeenCalledWith(
      'hello world',
      [
        expect.objectContaining({
          role: 'user',
          content: 'hello world',
        }),
      ],
      'gemini-3-flash-preview',
      expect.objectContaining({ planningLevel: DEFAULT_CONFIG.planningLevel }),
    );
    expect(result.current.query).toBe('');
  });

  it('finalizes a completed deep-think response into session messages', async () => {
    chatSessionsMock.sessions = [session];
    chatSessionsMock.currentSessionId = 'session-1';

    const { result, rerender } = renderHook(() => useAppLogic());

    await waitFor(() => {
      expect(result.current.messages).toEqual(session.messages);
    });

    deepThinkMock.appState = 'completed';
    deepThinkMock.finalOutput = 'final answer';
    deepThinkMock.managerAnalysis = { thought_process: 'analysis', experts: [] };
    deepThinkMock.experts = [
      {
        id: 'expert-1',
        role: 'Analyst',
        description: 'Analyzes',
        temperature: 0.2,
        prompt: 'analyze',
        status: 'completed',
      },
    ];
    deepThinkMock.synthesisThoughts = 'combined thoughts';
    deepThinkMock.processStartTime = 1000;
    deepThinkMock.processEndTime = 1500;

    rerender();

    await waitFor(() => {
      expect(chatSessionsMock.updateSessionMessages).toHaveBeenCalledWith(
        'session-1',
        expect.arrayContaining([
          expect.objectContaining({ content: 'saved prompt' }),
          expect.objectContaining({
            role: 'model',
            content: 'final answer',
            totalDuration: 500,
          }),
        ]),
      );
    });

    expect(deepThinkMock.resetDeepThink).toHaveBeenCalled();
    expect(result.current.focusTrigger).toBe(1);
  });

  it('resets app state and closes the sidebar on mobile for new chats and selection', async () => {
    const { result } = renderHook(() => useAppLogic());
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 640 });

    act(() => {
      result.current.setIsSidebarOpen(true);
      result.current.setQuery('draft');
      result.current.handleNewChat();
    });

    expect(deepThinkMock.stopDeepThink).toHaveBeenCalled();
    expect(deepThinkMock.resetDeepThink).toHaveBeenCalled();
    expect(chatSessionsMock.setCurrentSessionId).toHaveBeenCalledWith(null);
    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.query).toBe('');

    act(() => {
      result.current.handleSelectSession('session-2');
    });

    expect(chatSessionsMock.setCurrentSessionId).toHaveBeenCalledWith('session-2');
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it('updates per-model settings helpers and deletes the active session through the new-chat path', async () => {
    chatSessionsMock.sessions = [session];
    chatSessionsMock.currentSessionId = 'session-1';

    const { result } = renderHook(() => useAppLogic());

    await waitFor(() => {
      expect(result.current.messages).toEqual(session.messages);
    });

    act(() => {
      result.current.handleSetThinkingLevel('planningLevel', 'low');
      result.current.handleSetRecursiveLoop(false);
      result.current.clearInputError();
    });

    expect(result.current.config.modelPreferences?.['glm-5-turbo']).toMatchObject({
      planningLevel: 'low',
      enableRecursiveLoop: false,
    });
    expect(result.current.inputError).toBeNull();

    act(() => {
      result.current.handleDeleteSession('session-1', {
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });

    expect(chatSessionsMock.deleteSession).toHaveBeenCalledWith('session-1');
    expect(deepThinkMock.stopDeepThink).toHaveBeenCalled();
    expect(chatSessionsMock.setCurrentSessionId).toHaveBeenCalledWith(null);
  });

  it('deletes a message from the active session', async () => {
    const messageSession: ChatSession = {
      ...session,
      messages: [
        { id: 'user-1', role: 'user', content: 'question' },
        { id: 'model-1', role: 'model', content: 'answer' },
      ],
    };
    chatSessionsMock.sessions = [messageSession];
    chatSessionsMock.currentSessionId = 'session-1';

    const { result } = renderHook(() => useAppLogic());

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    act(() => {
      result.current.handleDeleteMessage('model-1');
    });

    expect(result.current.messages).toEqual([{ id: 'user-1', role: 'user', content: 'question' }]);
    expect(chatSessionsMock.updateSessionMessages).toHaveBeenCalledWith('session-1', [
      { id: 'user-1', role: 'user', content: 'question' },
    ]);
  });

  it('prepares a user message for resend by trimming later messages into the input', async () => {
    const messageSession: ChatSession = {
      ...session,
      messages: [
        { id: 'user-1', role: 'user', content: 'first question' },
        { id: 'model-1', role: 'model', content: 'first answer' },
        { id: 'user-2', role: 'user', content: 'rewrite this' },
        { id: 'model-2', role: 'model', content: 'second answer' },
      ],
    };
    chatSessionsMock.sessions = [messageSession];
    chatSessionsMock.currentSessionId = 'session-1';

    const { result } = renderHook(() => useAppLogic());

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(4);
    });

    act(() => {
      result.current.handleEditMessage('user-2', 'resend');
    });

    expect(result.current.query).toBe('rewrite this');
    expect(result.current.messages).toEqual([
      { id: 'user-1', role: 'user', content: 'first question' },
      { id: 'model-1', role: 'model', content: 'first answer' },
    ]);
    expect(result.current.focusTrigger).toBe(1);
    expect(chatSessionsMock.updateSessionMessages).toHaveBeenCalledWith('session-1', [
      { id: 'user-1', role: 'user', content: 'first question' },
      { id: 'model-1', role: 'model', content: 'first answer' },
    ]);
  });

  it('retries a model message from the previous user message', async () => {
    const messageSession: ChatSession = {
      ...session,
      messages: [
        { id: 'user-1', role: 'user', content: 'first question' },
        { id: 'model-1', role: 'model', content: 'first answer' },
        { id: 'user-2', role: 'user', content: 'retry me' },
        { id: 'model-2', role: 'model', content: 'stale answer' },
      ],
    };
    chatSessionsMock.sessions = [messageSession];
    chatSessionsMock.currentSessionId = 'session-1';

    const { result } = renderHook(() => useAppLogic());

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(4);
    });

    act(() => {
      result.current.handleRetryMessage('model-2');
    });

    const expectedHistory = [
      { id: 'user-1', role: 'user', content: 'first question' },
      { id: 'model-1', role: 'model', content: 'first answer' },
      { id: 'user-2', role: 'user', content: 'retry me' },
    ];
    expect(result.current.messages).toEqual(expectedHistory);
    expect(chatSessionsMock.updateSessionMessages).toHaveBeenCalledWith(
      'session-1',
      expectedHistory,
    );
    expect(deepThinkMock.stopDeepThink).toHaveBeenCalled();
    expect(deepThinkMock.resetDeepThink).toHaveBeenCalled();
    expect(deepThinkMock.runDynamicDeepThink).toHaveBeenCalledWith(
      'retry me',
      expectedHistory,
      'glm-5-turbo',
      expect.objectContaining({ planningLevel: DEFAULT_CONFIG.planningLevel }),
    );
  });

  it('forks the conversation by keeping messages through the selected message', async () => {
    const messageSession: ChatSession = {
      ...session,
      messages: [
        { id: 'user-1', role: 'user', content: 'first question' },
        { id: 'model-1', role: 'model', content: 'first answer' },
        { id: 'user-2', role: 'user', content: 'later question' },
      ],
    };
    chatSessionsMock.sessions = [messageSession];
    chatSessionsMock.currentSessionId = 'session-1';

    const { result } = renderHook(() => useAppLogic());

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    act(() => {
      result.current.handleForkMessage('model-1');
    });

    const forkedHistory = [
      { id: 'user-1', role: 'user', content: 'first question' },
      { id: 'model-1', role: 'model', content: 'first answer' },
    ];
    expect(result.current.messages).toEqual(forkedHistory);
    expect(result.current.focusTrigger).toBe(1);
    expect(chatSessionsMock.updateSessionMessages).toHaveBeenCalledWith('session-1', forkedHistory);
  });
});
