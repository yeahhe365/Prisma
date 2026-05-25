import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Folders, Search, Settings, SquarePen, X } from 'lucide-react';
import type { ChatGroup, ChatSession } from '@/types';
import { useDismissableLayer } from '@/hooks/useDismissableLayer';
import Logo from '@/components/Logo';
import { useDebounce } from '@/hooks/useDebounce';
import MiniSidebarRail from '@/components/sidebar/MiniSidebarRail';
import RecentChatsPopover from '@/components/sidebar/RecentChatsPopover';
import SessionList from '@/components/sidebar/SessionList';
import SidebarToggleIcon from '@/components/sidebar/SidebarToggleIcon';
import {
  SIDEBAR_ACTION_ROW_CLASS,
  SIDEBAR_EXPANDED_MIN_WIDTH_CLASS,
  SIDEBAR_EXPANDED_WIDTH_CLASS,
  SIDEBAR_ICON_BUTTON_CLASS,
  SIDEBAR_RAIL_WIDTH_CLASS,
} from '@/components/sidebar/sidebarConstants';
import { useRecentChatsPopover } from '@/components/sidebar/useRecentChatsPopover';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onOpenSettings: () => void;
  sessions: ChatSession[];
  groups?: ChatGroup[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession?: (id: string, title: string) => void;
  onTogglePinSession?: (id: string) => void;
  onDuplicateSession?: (id: string) => void;
  onExportSession?: (id: string) => void;
  onAddNewGroup?: () => void;
  onDeleteGroup?: (id: string) => void;
  onRenameGroup?: (id: string, title: string) => void;
  onMoveSessionToGroup?: (sessionId: string, groupId: string | null) => void;
  onToggleGroupExpansion?: (id: string) => void;
}

const Sidebar = ({
  isOpen,
  onClose,
  onOpen,
  onOpenSettings,
  sessions,
  groups = [],
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession = () => {},
  onTogglePinSession = () => {},
  onDuplicateSession = () => {},
  onExportSession = () => {},
  onAddNewGroup = () => {},
  onDeleteGroup = () => {},
  onRenameGroup = () => {},
  onMoveSessionToGroup = () => {},
  onToggleGroupExpansion = () => {},
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ id: string; title: string } | null>(null);
  const [editingSession, setEditingSession] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const groupEditInputRef = useRef<HTMLInputElement>(null);
  const sessionEditInputRef = useRef<HTMLInputElement>(null);
  const expandedPaneRef = useRef<HTMLDivElement>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 250);
  const {
    clearRecentChatsCloseTimer,
    closeRecentChats,
    handleRecentChatsButtonBlur,
    isRecentChatsOpen,
    openRecentChats,
    recentChatsButtonRef,
    recentChatsOpenMode,
    recentChatsPanelPosition,
    recentChatsPanelRef,
    scheduleRecentChatsClose,
  } = useRecentChatsPopover();

  const filteredSessions = useMemo(() => {
    if (!debouncedSearch.trim()) return sessions;
    const q = debouncedSearch.toLowerCase();
    return sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(q) ||
        session.messages.some((message) => message.content.toLowerCase().includes(q)),
    );
  }, [sessions, debouncedSearch]);

  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus();
    }
  }, [isSearching, isOpen]);

  useEffect(() => {
    if (editingGroup) {
      groupEditInputRef.current?.focus();
      groupEditInputRef.current?.select();
    }
  }, [editingGroup]);

  useEffect(() => {
    if (editingSession) {
      sessionEditInputRef.current?.focus();
      sessionEditInputRef.current?.select();
    }
  }, [editingSession]);

  useEffect(() => {
    const pane = expandedPaneRef.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (!pane) {
      return;
    }

    if (isOpen) {
      pane.inert = false;
      pane.removeAttribute('inert');
      return;
    }

    pane.inert = true;
    pane.setAttribute('inert', '');
  }, [isOpen]);

  useDismissableLayer(sessionMenuRef, Boolean(activeMenuId), () => {
    setActiveMenuId(null);
  });

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleNewChat = () => {
    onNewChat();
    if (window.innerWidth < 1024) onClose();
  };

  const handleAddNewGroup = () => {
    onAddNewGroup();
  };

  const handleRenameGroupStart = (group: ChatGroup) => {
    setEditingGroup({ id: group.id, title: group.title });
    setActiveMenuId(null);
  };

  const handleRenameSessionStart = (session: ChatSession) => {
    setEditingSession({ id: session.id, title: session.title });
    setActiveMenuId(null);
  };

  const handleGroupEditConfirm = () => {
    if (editingGroup?.title.trim()) {
      onRenameGroup(editingGroup.id, editingGroup.title.trim());
    }
    setEditingGroup(null);
  };

  const handleGroupEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      handleGroupEditConfirm();
    } else if (event.key === 'Escape') {
      setEditingGroup(null);
    }
  };

  const handleSessionEditConfirm = () => {
    if (editingSession?.title.trim()) {
      onRenameSession(editingSession.id, editingSession.title.trim());
    }
    setEditingSession(null);
  };

  const handleSessionEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      handleSessionEditConfirm();
    } else if (event.key === 'Escape') {
      setEditingSession(null);
    }
  };

  const handleMiniSearchClick = () => {
    setIsSearching(true);
    onOpen();
  };

  const handleEmptySpaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .filter((session) => session.id !== currentSessionId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8),
    [currentSessionId, sessions],
  );

  return (
    <>
      {isOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        data-testid="history-sidebar"
        className={`
          absolute inset-y-0 left-0 z-40 md:static md:z-auto
          h-full shrink-0 overflow-hidden border-r border-[var(--theme-border-primary)] bg-[var(--theme-bg-secondary)]
          transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] md:transition-[width]
          ${isOpen ? `w-64 translate-x-0 ${SIDEBAR_EXPANDED_WIDTH_CLASS}` : `w-64 -translate-x-full ${SIDEBAR_RAIL_WIDTH_CLASS} md:translate-x-0`}
        `}
        role="complementary"
        aria-label="历史记录"
      >
        <div
          ref={expandedPaneRef}
          data-sidebar-expanded-pane
          aria-hidden={!isOpen}
          className={`flex h-full w-64 min-w-[16rem] shrink-0 flex-col md:absolute md:inset-0 ${SIDEBAR_EXPANDED_WIDTH_CLASS} ${SIDEBAR_EXPANDED_MIN_WIDTH_CLASS} ${
            isOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-100 pointer-events-none md:opacity-0'
          } transition-opacity duration-200`}
        >
          <div className="flex h-[60px] shrink-0 items-center justify-between p-2 sm:p-3">
            <button
              type="button"
              onClick={onClose}
              className="flex min-w-0 items-center gap-2 border-0 bg-transparent pl-2 text-[var(--theme-text-primary)] transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
              aria-label="收起 Prisma 历史记录"
            >
              <Logo className="h-8 w-8 shrink-0 text-[var(--theme-text-primary)]" />
              <span className="truncate text-sm font-semibold">Prisma</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden -translate-y-1 rounded-md p-2 text-[var(--theme-icon-history)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] md:flex"
              aria-label="收起历史记录"
            >
              <SidebarToggleIcon size={20} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`${SIDEBAR_ICON_BUTTON_CLASS} md:hidden`}
              aria-label="关闭历史记录"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="shrink-0 space-y-1 px-2 pt-2" data-testid="sidebar-actions-stack">
            <button type="button" onClick={handleNewChat} className={SIDEBAR_ACTION_ROW_CLASS}>
              <SquarePen
                size={18}
                strokeWidth={2}
                className="shrink-0 text-[var(--theme-icon-history)]"
              />
              <span className="min-w-0 flex-1 truncate text-[var(--theme-text-primary)]">
                新建对话
              </span>
            </button>

            {isSearching ? (
              <div className="group flex h-9 w-full items-center gap-2 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-primary)] px-3 text-left text-sm shadow-sm transition-all duration-200 focus-within:border-[var(--theme-border-focus)] focus-within:ring-1 focus-within:ring-[var(--theme-border-focus)]">
                <Search
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-[var(--theme-icon-history)] transition-colors group-focus-within:text-[var(--theme-text-primary)]"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  aria-label="搜索对话"
                  placeholder="搜索对话..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') closeSearch();
                  }}
                  className="h-full w-full border-0 bg-transparent py-0 text-sm text-[var(--theme-text-primary)] outline-none placeholder:text-[var(--theme-text-tertiary)] focus:ring-0"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--theme-icon-history)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)]"
                  aria-label="清除搜索"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                className={SIDEBAR_ACTION_ROW_CLASS}
                aria-label="搜索对话"
              >
                <Search
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-[var(--theme-icon-history)]"
                />
                <span className="min-w-0 flex-1 truncate text-[var(--theme-text-primary)]">
                  搜索对话
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddNewGroup}
              className={SIDEBAR_ACTION_ROW_CLASS}
              aria-label="新建分组"
            >
              <Folders
                size={18}
                strokeWidth={2}
                className="shrink-0 text-[var(--theme-icon-history)]"
              />
              <span className="min-w-0 flex-1 truncate text-[var(--theme-text-primary)]">
                新建分组
              </span>
            </button>
          </div>

          <SessionList
            activeMenuId={activeMenuId}
            currentSessionId={currentSessionId}
            dragOverGroupId={dragOverGroupId}
            editingGroup={editingGroup}
            editingSession={editingSession}
            filteredSessions={filteredSessions}
            groupEditInputRef={groupEditInputRef}
            groups={groups}
            onClose={onClose}
            onDeleteGroup={onDeleteGroup}
            onDeleteSession={onDeleteSession}
            onDuplicateSession={onDuplicateSession}
            onEmptySpaceClick={handleEmptySpaceClick}
            onExportSession={onExportSession}
            onGroupEditChange={(title) =>
              setEditingGroup((current) => (current ? { ...current, title } : current))
            }
            onGroupEditConfirm={handleGroupEditConfirm}
            onGroupEditKeyDown={handleGroupEditKeyDown}
            onMoveSessionToGroup={onMoveSessionToGroup}
            onRenameGroupStart={handleRenameGroupStart}
            onRenameSessionStart={handleRenameSessionStart}
            onSelectSession={onSelectSession}
            onSessionEditChange={(title) =>
              setEditingSession((current) => (current ? { ...current, title } : current))
            }
            onSessionEditConfirm={handleSessionEditConfirm}
            onSessionEditKeyDown={handleSessionEditKeyDown}
            onTogglePinSession={onTogglePinSession}
            onToggleGroupExpansion={onToggleGroupExpansion}
            sessionMenuRef={sessionMenuRef}
            sessionEditInputRef={sessionEditInputRef}
            sessions={sessions}
            setActiveMenuId={setActiveMenuId}
            setDragOverGroupId={setDragOverGroupId}
          />

          <div className="shrink-0 bg-[var(--theme-bg-secondary)]/30 p-3">
            <button
              type="button"
              data-testid="sidebar-expanded-settings"
              onClick={onOpenSettings}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--theme-text-secondary)] transition-all duration-200 hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
            >
              <Settings
                size={20}
                strokeWidth={2}
                className="text-[var(--theme-icon-settings)] transition-colors group-hover:text-[var(--theme-text-primary)]"
              />
              <span>设置</span>
            </button>
          </div>
        </div>

        <MiniSidebarRail
          clearRecentChatsCloseTimer={clearRecentChatsCloseTimer}
          closeRecentChats={closeRecentChats}
          handleRecentChatsButtonBlur={handleRecentChatsButtonBlur}
          isOpen={isOpen}
          isRecentChatsOpen={isRecentChatsOpen}
          onNewChat={onNewChat}
          onOpen={onOpen}
          onOpenSettings={onOpenSettings}
          onSearchClick={handleMiniSearchClick}
          openRecentChats={openRecentChats}
          recentChatsButtonRef={recentChatsButtonRef}
          recentChatsOpenMode={recentChatsOpenMode}
          scheduleRecentChatsClose={scheduleRecentChatsClose}
        />

        <RecentChatsPopover
          clearRecentChatsCloseTimer={clearRecentChatsCloseTimer}
          closeRecentChats={closeRecentChats}
          isOpen={isOpen === false && isRecentChatsOpen}
          onSelectSession={onSelectSession}
          openRecentChats={openRecentChats}
          recentChatsOpenMode={recentChatsOpenMode}
          recentChatsPanelPosition={recentChatsPanelPosition}
          recentChatsPanelRef={recentChatsPanelRef}
          recentSessions={recentSessions}
          scheduleRecentChatsClose={scheduleRecentChatsClose}
        />
      </aside>
    </>
  );
};

export default Sidebar;
