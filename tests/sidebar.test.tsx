import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Sidebar from '../components/Sidebar';
import type { ChatSession } from '../types';

const sessions: ChatSession[] = [
  {
    id: '1',
    title: 'Frontend architecture',
    createdAt: new Date('2026-04-01').getTime(),
    model: 'gemini-3-flash-preview',
    messages: [{ id: 'm1', role: 'user', content: 'Discuss React structure' }],
  },
  {
    id: '2',
    title: 'Database notes',
    createdAt: new Date('2026-04-02').getTime(),
    model: 'gemini-3-flash-preview',
    messages: [{ id: 'm2', role: 'user', content: 'Prisma schema migration ideas' }],
  },
];

describe('Sidebar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
  });

  it('shows an empty state when there are no sessions', () => {
    render(
      <Sidebar
        isOpen
        onClose={vi.fn()}
        sessions={[]}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText('暂无对话记录')).toBeTruthy();
  });

  it('filters sessions after the debounce window', async () => {
    render(
      <Sidebar
        isOpen
        onClose={vi.fn()}
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('搜索对话...'), {
      target: { value: 'database' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(screen.getByText('Database notes')).toBeTruthy();
    expect(screen.queryByText('Frontend architecture')).toBeNull();
  });

  it('shows an empty search state when there are no matches', async () => {
    render(
      <Sidebar
        isOpen
        onClose={vi.fn()}
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('搜索对话...'), {
      target: { value: 'missing' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(screen.getByText('未找到结果')).toBeTruthy();
  });

  it('selects a session when the user clicks it', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onSelectSession = vi.fn();

    render(
      <Sidebar
        isOpen
        onClose={vi.fn()}
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={onSelectSession}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Frontend architecture'));

    expect(onSelectSession).toHaveBeenCalledWith('1');
  });

  it('renders session dates with a stable Chinese locale format', () => {
    render(
      <Sidebar
        isOpen
        onClose={vi.fn()}
        sessions={[sessions[0]]}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText('2026/4/1')).toBeTruthy();
  });

  it('starts a new chat and closes the sidebar on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 768 });
    vi.useRealTimers();
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onNewChat = vi.fn();

    render(
      <Sidebar
        isOpen
        onClose={onClose}
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewChat={onNewChat}
        onDeleteSession={vi.fn()}
      />,
    );

    await user.click(screen.getByText('新建对话'));

    expect(onNewChat).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
