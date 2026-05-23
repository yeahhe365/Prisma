import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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

const renderSidebar = (
  props: Partial<React.ComponentProps<typeof Sidebar>> = {},
) => {
  const defaultProps: React.ComponentProps<typeof Sidebar> = {
    isOpen: true,
    onClose: vi.fn(),
    onOpen: vi.fn(),
    onOpenSettings: vi.fn(),
    sessions,
    currentSessionId: null,
    onSelectSession: vi.fn(),
    onNewChat: vi.fn(),
    onDeleteSession: vi.fn(),
  };

  return render(<Sidebar {...defaultProps} {...props} />);
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
  });

  it('shows an empty state when there are no sessions', () => {
    renderSidebar({ sessions: [] });

    expect(screen.getByText('暂无对话记录')).toBeTruthy();
  });

  it('filters sessions after the debounce window', async () => {
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: '搜索对话' }));
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
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: '搜索对话' }));
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

    renderSidebar({ onSelectSession });

    await user.click(screen.getByText('Frontend architecture'));

    expect(onSelectSession).toHaveBeenCalledWith('1');
  });

  it('renders session dates with a stable Chinese locale format', () => {
    renderSidebar({ sessions: [sessions[0]] });

    expect(screen.getByText('2026/4/1')).toBeTruthy();
  });

  it('starts a new chat and closes the sidebar on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 768 });
    vi.useRealTimers();
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onNewChat = vi.fn();

    renderSidebar({ onClose, onNewChat });

    await user.click(screen.getByText('新建对话'));

    expect(onNewChat).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('uses AMC-style sidebar surfaces and rounded action rows', () => {
    const { container } = renderSidebar({ currentSessionId: '1' });

    const sidebar = container.querySelector('[data-testid="history-sidebar"]');
    const newChat = screen.getByText('新建对话').closest('button');
    const searchButton = screen.getByRole('button', { name: '搜索对话' });
    const activeSession = screen.getByText('Frontend architecture').closest('[data-session-row]');

    expect(sidebar?.className).toContain('bg-[var(--theme-bg-secondary)]');
    expect(sidebar?.className).toContain('border-[var(--theme-border-primary)]');
    expect(newChat?.className).toContain('rounded-full');
    expect(newChat?.className).toContain('bg-transparent');
    expect(searchButton.className).toContain('rounded-full');
    expect(searchButton.className).toContain('bg-transparent');
    expect(activeSession?.className).toContain('bg-[var(--theme-bg-tertiary)]');
  });

  it('keeps an AMC-style mini rail visible when collapsed on desktop', () => {
    const { container } = renderSidebar({ isOpen: false });

    const sidebar = screen.getByTestId('history-sidebar');
    const expandedPane = container.querySelector('[data-sidebar-expanded-pane]');
    const miniRail = screen.getByTestId('history-sidebar-mini-rail');

    expect(sidebar.className).toContain('md:w-[52.2px]');
    expect(sidebar.className).toContain('md:translate-x-0');
    expect(expandedPane?.getAttribute('aria-hidden')).toBe('true');
    expect(expandedPane?.className).toContain('md:opacity-0');
    expect(miniRail.className).toContain('md:flex');
  });

  it('opens the sidebar from the mini rail toggle button', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onOpen = vi.fn();

    renderSidebar({ isOpen: false, onOpen });

    await user.click(screen.getByRole('button', { name: '展开历史记录' }));

    expect(onOpen).toHaveBeenCalled();
  });

  it('opens search from the mini rail and focuses the inline field', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onOpen = vi.fn();

    renderSidebar({ isOpen: false, onOpen });

    await user.click(screen.getByRole('button', { name: '搜索对话' }));

    expect(onOpen).toHaveBeenCalled();
    expect(screen.getByPlaceholderText('搜索对话...')).toBeTruthy();
  });

  it('keeps the settings button at the bottom of expanded and collapsed sidebars', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    const { rerender } = renderSidebar({ onOpenSettings });

    await user.click(screen.getByTestId('sidebar-expanded-settings'));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);

    rerender(
      <Sidebar
        isOpen={false}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        onOpenSettings={onOpenSettings}
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('sidebar-mini-settings'));

    expect(onOpenSettings).toHaveBeenCalledTimes(2);
  });

  it('opens a recent chats popover from the collapsed rail', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    renderSidebar({ isOpen: false });

    await user.click(screen.getByRole('button', { name: '最近对话' }));

    const dialog = screen.getByRole('dialog', { name: '最近对话' });

    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText('Database notes')).toBeTruthy();
    expect(within(dialog).getByText('Frontend architecture')).toBeTruthy();
  });
});
