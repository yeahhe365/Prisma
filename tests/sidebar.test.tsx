import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Sidebar from '@/components/Sidebar';
import type { ChatGroup, ChatSession } from '@/types';

const sessions: ChatSession[] = [
  {
    id: '1',
    title: 'Frontend architecture',
    createdAt: new Date('2026-04-01').getTime(),
    model: 'gemini-3.5-flash',
    messages: [{ id: 'm1', role: 'user', content: 'Discuss React structure' }],
  },
  {
    id: '2',
    title: 'Database notes',
    createdAt: new Date('2026-04-02').getTime(),
    model: 'gemini-3.5-flash',
    messages: [{ id: 'm2', role: 'user', content: 'Prisma schema migration ideas' }],
  },
];

const groups: ChatGroup[] = [
  {
    id: 'group-1',
    title: 'Research',
    createdAt: new Date('2026-04-03').getTime(),
    isExpanded: true,
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
    groups: [],
    onAddNewGroup: vi.fn(),
    onDeleteGroup: vi.fn(),
    onRenameGroup: vi.fn(),
    onMoveSessionToGroup: vi.fn(),
    onToggleGroupExpansion: vi.fn(),
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

  it('adds the AMC-style new group action', () => {
    const onAddNewGroup = vi.fn();
    const { container } = renderSidebar({ onAddNewGroup });

    const newGroupButton = screen.getByRole('button', { name: '新建分组' });

    expect(newGroupButton.className).toContain('rounded-full');
    expect(container.querySelector('.lucide-folders')).toBeTruthy();

    fireEvent.click(newGroupButton);

    expect(onAddNewGroup).toHaveBeenCalled();
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
    expect(screen.getByRole('button', { name: '新建分组' }).className).toContain('rounded-full');
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

  it('supports AMC-style session edit, pin, duplicate, and export actions', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onRenameSession = vi.fn();
    const onTogglePinSession = vi.fn();
    const onDuplicateSession = vi.fn();
    const onExportSession = vi.fn();

    renderSidebar({
      onRenameSession,
      onTogglePinSession,
      onDuplicateSession,
      onExportSession,
    });

    await user.click(screen.getByRole('button', { name: '打开 Frontend architecture 操作菜单' }));

    const menu = screen.getByRole('menu', { name: 'Frontend architecture 操作' });
    expect(within(menu).getByRole('menuitem', { name: '编辑' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: '置顶' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: '创建副本' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: '导出对话' })).toBeTruthy();

    await user.click(within(menu).getByRole('menuitem', { name: '编辑' }));
    const editInput = screen.getByDisplayValue('Frontend architecture');
    fireEvent.change(editInput, { target: { value: 'Frontend plan' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    expect(onRenameSession).toHaveBeenCalledWith('1', 'Frontend plan');

    await user.click(screen.getByRole('button', { name: '打开 Frontend architecture 操作菜单' }));
    await user.click(screen.getByRole('menuitem', { name: '置顶' }));

    expect(onTogglePinSession).toHaveBeenCalledWith('1');

    await user.click(screen.getByRole('button', { name: '打开 Frontend architecture 操作菜单' }));
    await user.click(screen.getByRole('menuitem', { name: '创建副本' }));

    expect(onDuplicateSession).toHaveBeenCalledWith('1');

    await user.click(screen.getByRole('button', { name: '打开 Frontend architecture 操作菜单' }));
    await user.click(screen.getByRole('menuitem', { name: '导出对话' }));

    expect(onExportSession).toHaveBeenCalledWith('1');
  });

  it('opens the session action menu from right-click like AMC', () => {
    renderSidebar();

    const sessionRow = screen.getByText('Frontend architecture').closest('[data-session-row]');
    if (!sessionRow) {
      throw new Error('expected a session row');
    }

    fireEvent.contextMenu(sessionRow);

    expect(screen.getByRole('menu', { name: 'Frontend architecture 操作' })).toBeTruthy();
  });

  it('separates ungrouped pinned sessions into an AMC-style pinned section', () => {
    renderSidebar({
      sessions: [
        { ...sessions[0], isPinned: true },
        { ...sessions[1], isPinned: false },
      ],
    });

    const pinnedSection = screen.getByText('已置顶').parentElement;
    expect(pinnedSection).toBeTruthy();
    expect(within(pinnedSection as HTMLElement).getByText('Frontend architecture')).toBeTruthy();
    expect(screen.getByText('Database notes')).toBeTruthy();
    expect(pinnedSection?.querySelector('.lucide-pin')).toBeTruthy();
  });

  it('renders persisted groups with their sessions and keeps empty groups visible', () => {
    const groupedSessions: ChatSession[] = [
      { ...sessions[0], groupId: 'group-1' },
      { ...sessions[1], groupId: null },
    ];

    const { rerender } = renderSidebar({
      groups,
      sessions: groupedSessions,
    });

    expect(screen.getByText('Research')).toBeTruthy();
    expect(screen.getByText('Frontend architecture')).toBeTruthy();
    expect(screen.getByText('Database notes')).toBeTruthy();

    rerender(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        onOpenSettings={vi.fn()}
        sessions={[]}
        groups={groups}
        currentSessionId={null}
        onSelectSession={vi.fn()}
        onNewChat={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText('Research')).toBeTruthy();
    expect(screen.queryByText('暂无对话记录')).toBeNull();
  });

  it('toggles group expansion from the group header', () => {
    const onToggleGroupExpansion = vi.fn();

    renderSidebar({
      groups,
      sessions: [{ ...sessions[0], groupId: 'group-1' }],
      onToggleGroupExpansion,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Research' }));

    expect(onToggleGroupExpansion).toHaveBeenCalledWith('group-1');
  });

  it('edits and deletes groups from the AMC-style group menu', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onDeleteGroup = vi.fn();
    const onRenameGroup = vi.fn();

    renderSidebar({
      groups,
      sessions: [{ ...sessions[0], groupId: 'group-1' }],
      onDeleteGroup,
      onRenameGroup,
    });

    await user.click(screen.getByRole('button', { name: '打开 Research 分组菜单' }));

    const menu = screen.getByRole('menu', { name: 'Research 分组操作' });
    expect(menu.className).toContain('right-3');
    expect(menu.className).toContain('-top-1');

    await user.click(within(menu).getByRole('menuitem', { name: '编辑' }));

    const editInput = screen.getByDisplayValue('Research');
    fireEvent.change(editInput, { target: { value: 'Work' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    expect(onRenameGroup).toHaveBeenCalledWith('group-1', 'Work');

    await user.click(screen.getByRole('button', { name: '打开 Research 分组菜单' }));
    await user.click(screen.getByRole('menuitem', { name: '删除' }));

    expect(onDeleteGroup).toHaveBeenCalledWith('group-1');
  });

  it('moves sessions into groups and back to all conversations with drag and drop', () => {
    const onMoveSessionToGroup = vi.fn();
    const dataTransfer = {
      data: {} as Record<string, string>,
      dropEffect: '',
      effectAllowed: '',
      getData(key: string) {
        return this.data[key] || '';
      },
      setData(key: string, value: string) {
        this.data[key] = value;
      },
    };

    const { container } = renderSidebar({
      groups,
      sessions,
      onMoveSessionToGroup,
    });

    const sessionRow = screen.getByText('Frontend architecture').closest('[data-session-row]');
    const groupRow = screen.getByText('Research').closest('[data-group-row]');
    const sessionList = container.querySelector('[data-sidebar-session-list]');

    if (!sessionRow || !groupRow || !sessionList) {
      throw new Error('expected draggable session, group row, and sidebar list');
    }

    fireEvent.dragStart(sessionRow, { dataTransfer });
    fireEvent.drop(groupRow, { dataTransfer });
    fireEvent.drop(sessionList, { dataTransfer });

    expect(onMoveSessionToGroup).toHaveBeenCalledWith('1', 'group-1');
    expect(onMoveSessionToGroup).toHaveBeenCalledWith('1', null);
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

  it('opens the sidebar when the collapsed rail blank area is clicked like AMC', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onOpen = vi.fn();

    renderSidebar({ isOpen: false, onOpen });

    await user.click(screen.getByTestId('history-sidebar-mini-rail'));

    expect(onOpen).toHaveBeenCalled();
  });

  it('collapses the sidebar when the expanded history blank area is clicked like AMC', () => {
    const onClose = vi.fn();
    const { container } = renderSidebar({ onClose });
    const sidebarScroller = container.querySelector('[data-sidebar-session-scroller]');

    if (!sidebarScroller) {
      throw new Error('expected sidebar session scroller');
    }

    fireEvent.click(sidebarScroller);

    expect(onClose).toHaveBeenCalled();
  });

  it('does not collapse the sidebar when clicking session rows', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderSidebar({ onClose });

    await user.click(screen.getByText('Frontend architecture'));

    expect(onClose).not.toHaveBeenCalled();
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
