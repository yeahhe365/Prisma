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

const renderSidebar = (props: Partial<React.ComponentProps<typeof Sidebar>> = {}) => {
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

const domRect = (rect: Partial<DOMRect>): DOMRect =>
  ({
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    top: rect.top ?? rect.y ?? 0,
    right: rect.right ?? 0,
    bottom: rect.bottom ?? 0,
    left: rect.left ?? rect.x ?? 0,
    toJSON: () => ({}),
  }) as DOMRect;

describe('Sidebar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
  });

  it('shows an empty state when there are no sessions', () => {
    const { container } = renderSidebar({ sessions: [] });

    const emptyState = screen.getByText('暂无对话记录');

    expect(emptyState.className).toContain('p-4');
    expect(emptyState.className).toContain('cursor-auto');
    expect(container.querySelector('.lucide-sparkles')).toBeNull();
    expect(screen.queryByText('开始对话后将显示在这里')).toBeNull();
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
    const sidebarScroller = container.querySelector('[data-sidebar-session-scroller]');
    const collapseButton = screen.getByRole('button', { name: '收起历史记录' });
    const newChat = screen.getByText('新建对话').closest('button');
    const searchButton = screen.getByRole('button', { name: '搜索对话' });
    const activeSession = screen.getByText('Frontend architecture').closest('[data-session-row]');

    expect(sidebar?.className).toContain('bg-[var(--theme-bg-secondary)]');
    expect(sidebar?.className).toContain('border-[var(--theme-border-primary)]');
    expect(sidebarScroller?.className).toContain('cursor-ew-resize');
    expect(collapseButton.className).toContain('rounded-md');
    expect(collapseButton.className).toContain('p-2');
    expect(newChat?.className).toContain('rounded-full');
    expect(newChat?.className).toContain('bg-transparent');
    expect(searchButton.className).toContain('rounded-full');
    expect(searchButton.className).toContain('bg-transparent');
    expect(activeSession?.className).toContain('bg-[var(--theme-bg-tertiary)]');
  });

  it('renders session rows as compact AMC-style title rows', () => {
    renderSidebar({ currentSessionId: '1' });

    const activeSession = screen.getByText('Frontend architecture').closest('[data-session-row]');

    expect(activeSession?.className).toContain('my-0.5');
    expect(activeSession?.querySelector('.lucide-message-square')).toBeNull();
    expect(screen.queryByText('Discuss React structure')).toBeNull();
    expect(screen.queryByText('2026/4/1')).toBeNull();
    expect(
      screen.getByRole('button', { name: '打开 Frontend architecture 操作菜单' }),
    ).toBeTruthy();
  });

  it('uses an AMC-style session action menu for deleting chats', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onDeleteSession = vi.fn();

    renderSidebar({ onDeleteSession });

    await user.click(screen.getByRole('button', { name: '打开 Frontend architecture 操作菜单' }));

    const menu = screen.getByRole('menu', { name: 'Frontend architecture 操作' });
    const deleteButton = within(menu).getByRole('menuitem', { name: '删除' });

    expect(menu.className).toContain('right-3');
    expect(menu.className).toContain('top-9');

    await user.click(deleteButton);

    expect(onDeleteSession).toHaveBeenCalledWith('1', expect.anything());
  });

  it('keeps an AMC-style mini rail visible when collapsed on desktop', () => {
    const { container } = renderSidebar({ isOpen: false });

    const sidebar = screen.getByTestId('history-sidebar');
    const expandedPane = container.querySelector('[data-sidebar-expanded-pane]');
    const miniRail = screen.getByTestId('history-sidebar-mini-rail');

    expect(sidebar.className).toContain('md:w-[52.2px]');
    expect(sidebar.className).toContain('md:translate-x-0');
    expect(expandedPane?.getAttribute('aria-hidden')).toBe('true');
    expect(expandedPane?.hasAttribute('inert')).toBe(true);
    expect(expandedPane?.className).toContain('md:opacity-0');
    expect(miniRail.className).toContain('md:flex');
  });

  it('uses AMC sidebar toggle and history icons on the desktop rail', () => {
    renderSidebar({ isOpen: false });

    const openToggleIcon = screen
      .getByRole('button', { name: '展开历史记录' })
      .querySelector('svg');
    const recentChatsIcon = screen.getByRole('button', { name: '最近对话' }).querySelector('svg');

    expect(openToggleIcon?.querySelector('line[x1="4"][x2="20"][y1="8"][y2="8"]')).toBeTruthy();
    expect(openToggleIcon?.querySelector('line[x1="4"][x2="14"][y1="16"][y2="16"]')).toBeTruthy();
    expect(recentChatsIcon?.getAttribute('class')).toContain('lucide-history');
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

  it('opens the recent chats popover on hover from the collapsed rail', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();

    renderSidebar({ isOpen: false });

    await user.hover(screen.getByRole('button', { name: '最近对话' }));

    expect(screen.getByRole('dialog', { name: '最近对话' })).toBeTruthy();
  });

  it('positions the collapsed recent chats popover beside its trigger like AMC', async () => {
    vi.useRealTimers();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    const user = userEvent.setup();

    renderSidebar({ isOpen: false });

    const recentChatsButton = screen.getByRole('button', { name: '最近对话' });
    vi.spyOn(recentChatsButton, 'getBoundingClientRect').mockReturnValue(
      domRect({
        left: 0,
        right: 52.2,
        top: 140,
        bottom: 180,
        width: 52.2,
        height: 40,
      }),
    );

    await user.click(recentChatsButton);

    const dialog = screen.getByRole('dialog', { name: '最近对话' });
    expect(dialog.style.position).toBe('fixed');
    expect(dialog.style.top).toBe('140px');
    expect(dialog.style.left).toBe('52.2px');
    expect(dialog.style.width).toBe('320px');
    expect(dialog.style.maxHeight).toBe('calc(100vh - 156px)');
    expect(dialog.style.zIndex).toBe('9999');
  });
});
