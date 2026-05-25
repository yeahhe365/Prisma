// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useAppLogic', () => ({
  useAppLogic: () => ({
    sessions: [],
    groups: [],
    currentSessionId: null,
    messages: [],
    query: '',
    setQuery: vi.fn(),
    selectedModel: 'glm-5-turbo',
    setSelectedModel: vi.fn(),
    config: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      planningLevel: 'medium',
      expertLevel: 'medium',
      synthesisLevel: 'medium',
      enableRecursiveLoop: false,
      customModels: [],
    },
    setConfig: vi.fn(),
    effectiveConfig: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      planningLevel: 'medium',
      expertLevel: 'medium',
      synthesisLevel: 'medium',
      enableRecursiveLoop: false,
      customModels: [],
    },
    isSidebarOpen: false,
    setIsSidebarOpen: vi.fn(),
    isSettingsOpen: false,
    setIsSettingsOpen: vi.fn(),
    appState: 'idle',
    managerAnalysis: null,
    experts: [],
    finalOutput: '',
    processStartTime: null,
    processEndTime: null,
    handleRun: vi.fn(),
    handleNewChat: vi.fn(),
    handleSelectSession: vi.fn(),
    handleDeleteSession: vi.fn(),
    createGroup: vi.fn(),
    deleteGroup: vi.fn(),
    renameGroup: vi.fn(),
    moveSessionToGroup: vi.fn(),
    toggleGroupExpansion: vi.fn(),
    stopDeepThink: vi.fn(),
    focusTrigger: 0,
    inputError: null,
    clearInputError: vi.fn(),
    handleSetThinkingLevel: vi.fn(),
    handleSetRecursiveLoop: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => ({ isDark: false, toggle: vi.fn() }),
}));

vi.mock('@/components/settings/SettingsModal', () => ({
  default: () => <div data-testid="settings-modal" />,
}));

vi.mock('@/components/Header', () => ({
  default: () => <header data-testid="app-header" />,
}));

vi.mock('@/components/Sidebar', () => ({
  default: () => <aside data-testid="app-sidebar" />,
}));

vi.mock('@/components/ChatArea', () => ({
  default: () => <section data-testid="chat-area" />,
}));

vi.mock('@/components/ChatInput', () => ({
  default: () => <form data-testid="chat-input" />,
}));

describe('App layout', () => {
  it('keeps the header inside the main content beside the sidebar like AMC', async () => {
    const { default: App } = await import('@/App');

    render(<App />);

    const header = screen.getByTestId('app-header');
    const sidebar = screen.getByTestId('app-sidebar');
    const main = header.closest('main');

    expect(main).toBeTruthy();
    expect(main?.className).toContain('flex-col');
    expect(sidebar.parentElement?.className).toContain('flex');
    expect(sidebar.parentElement).toBe(main?.parentElement);
  });

  it('uses the AMC chat input width configuration', async () => {
    const { default: App } = await import('@/App');

    render(<App />);

    const chatInput = screen.getByTestId('chat-input');
    const inputWidthContainer = chatInput.parentElement;

    expect(inputWidthContainer?.className).toContain('max-w-[40.32rem]');
    expect(inputWidthContainer?.className).not.toContain('max-w-4xl');
  });
});
