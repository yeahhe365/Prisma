import React, {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  History as HistoryIcon,
  MoreHorizontal,
  Search,
  Settings,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';
import type { ChatSession } from '../types';
import Logo from './Logo';
import { useDebounce } from '../hooks/useDebounce';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onOpenSettings: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

const SIDEBAR_ICON_BUTTON_CLASS =
  'flex items-center justify-center p-2.5 rounded-xl text-[var(--theme-icon-history)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]';

const SIDEBAR_ACTION_ROW_CLASS =
  'group flex h-8 w-full items-center gap-3 rounded-full bg-transparent px-3 text-left text-sm transition-colors hover:bg-[var(--theme-bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-border-focus)]';

const RECENT_CHATS_CLOSE_DELAY_MS = 120;
const RECENT_CHATS_PANEL_WIDTH = 320;
const RECENT_CHATS_PANEL_GAP = 0;
const RECENT_CHATS_PANEL_MARGIN = 16;
const SIDEBAR_EXPANDED_WIDTH_CLASS = 'md:w-[16.2rem]';
const SIDEBAR_EXPANDED_MIN_WIDTH_CLASS = 'md:min-w-[16.2rem]';
const SIDEBAR_RAIL_WIDTH_CLASS = 'md:w-[52.2px]';
const SIDEBAR_RAIL_MIN_WIDTH_CLASS = 'min-w-[52.2px]';
const SIDEBAR_RAIL_ICON_GAP_CLASS = 'gap-[0.56rem]';

type RecentChatsOpenMode = 'hover' | 'focus' | 'click';

const IconSidebarToggle = ({
  size = 20,
  strokeWidth = 2,
  className,
  color = 'currentColor',
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" x2="20" y1="8" y2="8" />
    <line x1="4" x2="14" y1="16" y2="16" />
  </svg>
);

const MiniSidebarButton = ({
  onClick,
  icon: Icon,
  title,
  testId,
  className = '',
}: {
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  testId?: string;
  className?: string;
}) => (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    className={[SIDEBAR_ICON_BUTTON_CLASS, 'cursor-pointer', className].filter(Boolean).join(' ')}
    title={title}
    aria-label={title}
    data-testid={testId}
  >
    <Icon size={20} strokeWidth={2} />
  </button>
);

const Sidebar = ({
  isOpen,
  onClose,
  onOpen,
  onOpenSettings,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRecentChatsOpen, setIsRecentChatsOpen] = useState(false);
  const [recentChatsOpenMode, setRecentChatsOpenMode] = useState<RecentChatsOpenMode | null>(null);
  const [recentChatsPanelPosition, setRecentChatsPanelPosition] = useState<CSSProperties>({});
  const [activeSessionMenuId, setActiveSessionMenuId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const expandedPaneRef = useRef<HTMLDivElement>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const recentChatsButtonRef = useRef<HTMLButtonElement>(null);
  const recentChatsPanelRef = useRef<HTMLDivElement>(null);
  const recentChatsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 250);

  const computeRecentChatsPanelPosition = useCallback((): CSSProperties => {
    if (!recentChatsButtonRef.current) {
      return {};
    }

    const buttonRect = recentChatsButtonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const leftCandidate = buttonRect.right + RECENT_CHATS_PANEL_GAP;
    const fitsRight =
      leftCandidate + RECENT_CHATS_PANEL_WIDTH <= viewportWidth - RECENT_CHATS_PANEL_MARGIN;
    const left = fitsRight
      ? leftCandidate
      : Math.max(
          RECENT_CHATS_PANEL_MARGIN,
          buttonRect.left - RECENT_CHATS_PANEL_WIDTH - RECENT_CHATS_PANEL_GAP,
        );
    const top = Math.min(
      Math.max(RECENT_CHATS_PANEL_MARGIN, buttonRect.top),
      viewportHeight - RECENT_CHATS_PANEL_MARGIN * 2,
    );

    return {
      position: 'fixed',
      top,
      left,
      width: RECENT_CHATS_PANEL_WIDTH,
      maxHeight: `calc(100vh - ${top + RECENT_CHATS_PANEL_MARGIN}px)`,
      zIndex: 9999,
    };
  }, []);

  const clearRecentChatsCloseTimer = useCallback(() => {
    if (recentChatsCloseTimerRef.current !== null) {
      clearTimeout(recentChatsCloseTimerRef.current);
      recentChatsCloseTimerRef.current = null;
    }
  }, []);

  const closeRecentChats = useCallback(() => {
    clearRecentChatsCloseTimer();
    setIsRecentChatsOpen(false);
    setRecentChatsOpenMode(null);
  }, [clearRecentChatsCloseTimer]);

  const openRecentChats = useCallback(
    (mode: RecentChatsOpenMode) => {
      clearRecentChatsCloseTimer();
      setRecentChatsPanelPosition(computeRecentChatsPanelPosition());
      setIsRecentChatsOpen(true);
      setRecentChatsOpenMode((currentMode) => {
        if (currentMode === 'click' && mode !== 'click') {
          return currentMode;
        }
        return mode;
      });
    },
    [clearRecentChatsCloseTimer, computeRecentChatsPanelPosition],
  );

  const scheduleRecentChatsClose = useCallback(() => {
    if (recentChatsOpenMode === 'click') {
      clearRecentChatsCloseTimer();
      return;
    }

    clearRecentChatsCloseTimer();
    recentChatsCloseTimerRef.current = setTimeout(() => {
      setIsRecentChatsOpen(false);
      setRecentChatsOpenMode(null);
      recentChatsCloseTimerRef.current = null;
    }, RECENT_CHATS_CLOSE_DELAY_MS);
  }, [clearRecentChatsCloseTimer, recentChatsOpenMode]);

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

  useEffect(() => () => clearRecentChatsCloseTimer(), [clearRecentChatsCloseTimer]);

  useEffect(() => {
    if (!isRecentChatsOpen) return;

    const updatePosition = () => {
      setRecentChatsPanelPosition(computeRecentChatsPanelPosition());
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [computeRecentChatsPanelPosition, isRecentChatsOpen]);

  useEffect(() => {
    if (!isRecentChatsOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        (recentChatsButtonRef.current && target && recentChatsButtonRef.current.contains(target)) ||
        (recentChatsPanelRef.current && target && recentChatsPanelRef.current.contains(target))
      ) {
        return;
      }
      closeRecentChats();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRecentChats();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeRecentChats, isRecentChatsOpen]);

  useEffect(() => {
    if (!activeSessionMenuId) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (sessionMenuRef.current && target && sessionMenuRef.current.contains(target)) {
        return;
      }
      setActiveSessionMenuId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveSessionMenuId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSessionMenuId]);

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleNewChat = () => {
    onNewChat();
    if (window.innerWidth < 1024) onClose();
  };

  const handleMiniSearchClick = () => {
    setIsSearching(true);
    onOpen();
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
              <IconSidebarToggle size={20} strokeWidth={2} />
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
          </div>

          <div
            data-sidebar-session-scroller
            className="custom-scrollbar flex-grow cursor-ew-resize overflow-y-auto p-2"
          >
            {sessions.length === 0 ? (
              <p className="cursor-auto p-4 text-center text-xs text-[var(--theme-text-tertiary)] sm:text-sm">
                暂无对话记录
              </p>
            ) : filteredSessions.length === 0 ? (
              <p className="cursor-auto p-4 text-center text-xs text-[var(--theme-text-tertiary)] sm:text-sm">
                未找到结果
              </p>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  data-session-row
                  className={`group relative my-0.5 rounded-lg transition-colors duration-100 ease-out ${
                    currentSessionId === session.id ? 'bg-[var(--theme-bg-tertiary)]' : ''
                  } ${activeSessionMenuId === session.id ? 'z-20' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`relative w-full rounded-lg py-2 pl-2.5 pr-1 text-left text-sm transition-colors ${
                      currentSessionId === session.id
                        ? 'text-[var(--theme-text-primary)]'
                        : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)]'
                    }`}
                    aria-current={currentSessionId === session.id ? 'page' : undefined}
                  >
                    <span className="flex w-full min-w-0 items-center pr-8 text-inherit">
                      <span className="truncate font-medium" title={session.title}>
                        {session.title}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveSessionMenuId((currentMenuId) =>
                        currentMenuId === session.id ? null : session.id,
                      );
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--theme-text-tertiary)] opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-border-focus)]"
                    aria-label={`打开 ${session.title} 操作菜单`}
                    aria-haspopup="menu"
                    aria-expanded={activeSessionMenuId === session.id}
                  >
                    <MoreHorizontal size={16} strokeWidth={2} />
                  </button>
                  {activeSessionMenuId === session.id && (
                    <div
                      ref={sessionMenuRef}
                      className="absolute right-3 top-9 z-10 w-40 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-primary)] py-1 shadow-lg"
                      role="menu"
                      aria-label={`${session.title} 操作`}
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          onDeleteSession(session.id, event);
                          setActiveSessionMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--theme-text-danger)] transition-colors hover:bg-[var(--theme-bg-danger)]/10 focus:bg-[var(--theme-bg-danger)]/10 focus:outline-none"
                        role="menuitem"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                        <span>删除</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

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

        <div
          data-testid="history-sidebar-mini-rail"
          aria-hidden={isOpen}
          className={`absolute inset-0 hidden h-full w-full ${SIDEBAR_RAIL_MIN_WIDTH_CLASS} cursor-ew-resize flex-col items-center ${SIDEBAR_RAIL_ICON_GAP_CLASS} py-4 transition-[opacity,background-color] duration-200 hover:bg-[var(--theme-bg-tertiary)]/30 md:flex ${
            isOpen ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
          }`}
          onClick={onOpen}
        >
          <MiniSidebarButton
            onClick={onOpen}
            icon={IconSidebarToggle}
            title="展开历史记录"
            className="-translate-y-1"
          />

          <div className="my-1 h-px w-8 bg-[var(--theme-border-primary)]" />

          <MiniSidebarButton onClick={onNewChat} icon={SquarePen} title="新建对话" />
          <MiniSidebarButton onClick={handleMiniSearchClick} icon={Search} title="搜索对话" />
          <button
            ref={recentChatsButtonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isRecentChatsOpen && recentChatsOpenMode === 'click') {
                closeRecentChats();
                return;
              }
              openRecentChats('click');
            }}
            onMouseEnter={() => {
              if (recentChatsOpenMode === 'click') {
                clearRecentChatsCloseTimer();
                return;
              }
              openRecentChats('hover');
            }}
            onMouseLeave={() => {
              if (recentChatsOpenMode === 'hover') {
                scheduleRecentChatsClose();
              }
            }}
            onFocus={() => openRecentChats('focus')}
            onBlur={(event) => {
              const nextFocusTarget = event.relatedTarget as Node | null;
              if (
                nextFocusTarget &&
                ((recentChatsButtonRef.current &&
                  recentChatsButtonRef.current.contains(nextFocusTarget)) ||
                  (recentChatsPanelRef.current &&
                    recentChatsPanelRef.current.contains(nextFocusTarget)))
              ) {
                return;
              }
              if (recentChatsOpenMode === 'focus') {
                scheduleRecentChatsClose();
              }
            }}
            className={SIDEBAR_ICON_BUTTON_CLASS}
            title="最近对话"
            aria-label="最近对话"
            aria-haspopup="dialog"
            aria-expanded={isRecentChatsOpen}
          >
            <HistoryIcon size={20} strokeWidth={2} />
          </button>

          <div className="mt-auto">
            <MiniSidebarButton
              onClick={onOpenSettings}
              icon={Settings}
              title="设置"
              testId="sidebar-mini-settings"
            />
          </div>
        </div>

        {isOpen === false &&
          isRecentChatsOpen &&
          createPortal(
            <div
              ref={recentChatsPanelRef}
              style={recentChatsPanelPosition}
              className="overflow-hidden rounded-2xl border border-[var(--theme-border-primary)] bg-[var(--theme-bg-primary)] shadow-2xl"
              onMouseEnter={() => {
                if (recentChatsOpenMode === 'click') {
                  clearRecentChatsCloseTimer();
                  return;
                }
                openRecentChats('hover');
              }}
              onMouseLeave={() => {
                if (recentChatsOpenMode === 'hover') {
                  scheduleRecentChatsClose();
                }
              }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-label="最近对话"
            >
              <div className="px-4 py-3 text-sm font-medium text-[var(--theme-text-secondary)]">
                最近对话
              </div>
              <div className="max-h-[min(420px,calc(100vh-120px))] overflow-y-auto py-1 custom-scrollbar">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        onSelectSession(session.id);
                        closeRecentChats();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)] focus:bg-[var(--theme-bg-tertiary)] focus:outline-none"
                    >
                      <span className="block truncate" title={session.title}>
                        {session.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-[var(--theme-text-tertiary)]">
                    暂无对话记录
                  </p>
                )}
              </div>
            </div>,
            document.body,
          )}
      </aside>
    </>
  );
};

export default Sidebar;
