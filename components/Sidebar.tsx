import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';
import { ChatSession } from '../types';
import Logo from './Logo';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay]);

  return debounced;
}

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recentChatsButtonRef = useRef<HTMLButtonElement>(null);
  const recentChatsPanelRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 250);

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
    if (!isRecentChatsOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        (recentChatsButtonRef.current && target && recentChatsButtonRef.current.contains(target)) ||
        (recentChatsPanelRef.current && target && recentChatsPanelRef.current.contains(target))
      ) {
        return;
      }
      setIsRecentChatsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRecentChatsOpen(false);
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
  }, [isRecentChatsOpen]);

  const getLastMessage = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return null;
    return lastMessage.role === 'user' ? lastMessage.content : lastMessage.content?.slice(0, 60);
  };

  const formatSessionDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

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
          ${isOpen ? 'w-64 translate-x-0 md:w-[16.2rem]' : 'w-64 -translate-x-full md:w-[52.2px] md:translate-x-0'}
        `}
        role="complementary"
        aria-label="历史记录"
      >
        <div
          data-sidebar-expanded-pane
          aria-hidden={!isOpen}
          className={`flex h-full w-64 min-w-[16rem] shrink-0 flex-col md:absolute md:inset-0 md:w-[16.2rem] md:min-w-[16.2rem] ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-100 pointer-events-none md:opacity-0'
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
              className={`${SIDEBAR_ICON_BUTTON_CLASS} hidden -translate-y-1 md:flex`}
              aria-label="收起历史记录"
            >
              <PanelLeftClose size={20} strokeWidth={2} />
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
              <SquarePen size={18} strokeWidth={2} className="shrink-0 text-[var(--theme-icon-history)]" />
              <span className="min-w-0 flex-1 truncate text-[var(--theme-text-primary)]">新建对话</span>
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
                <Search size={18} strokeWidth={2} className="shrink-0 text-[var(--theme-icon-history)]" />
                <span className="min-w-0 flex-1 truncate text-[var(--theme-text-primary)]">搜索对话</span>
              </button>
            )}
          </div>

          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
            {sessions.length === 0 ? (
              <div className="py-10 text-center">
                <Sparkles size={28} className="mx-auto mb-3 text-[var(--theme-text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--theme-text-tertiary)]">暂无对话记录</p>
                <p className="mt-1 text-xs text-[var(--theme-text-tertiary)]">开始对话后将显示在这里</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-10 text-center">
                <Search size={28} className="mx-auto mb-3 text-[var(--theme-text-tertiary)]" />
                <p className="text-sm text-[var(--theme-text-tertiary)]">未找到结果</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const lastMessage = getLastMessage(session);

                return (
                  <div
                    key={session.id}
                    data-session-row
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`
                      group relative flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors
                      ${
                        currentSessionId === session.id
                          ? 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]'
                          : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]/60'
                      }
                    `}
                  >
                    <MessageSquare
                      size={16}
                      className={`mt-0.5 shrink-0 ${currentSessionId === session.id ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-icon-history)]'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate pr-6 text-sm font-medium">{session.title}</h4>
                      {lastMessage && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-[var(--theme-text-tertiary)]">
                          {lastMessage}
                        </p>
                      )}
                      <span className="mt-0.5 block text-[10px] text-[var(--theme-text-tertiary)]">
                        {formatSessionDate(session.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => onDeleteSession(session.id, event)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--theme-text-tertiary)] opacity-0 transition-all hover:bg-[var(--theme-bg-danger)]/10 hover:text-[var(--theme-text-danger)] focus:opacity-100 group-hover:opacity-100"
                      title="删除对话"
                      aria-label="删除对话"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
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
          className={`absolute inset-0 hidden h-full w-full min-w-[52.2px] cursor-ew-resize flex-col items-center gap-[0.56rem] py-4 transition-[opacity,background-color] duration-200 hover:bg-[var(--theme-bg-tertiary)]/30 md:flex ${
            isOpen ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
          }`}
          onClick={onOpen}
        >
          <MiniSidebarButton onClick={onOpen} icon={PanelLeftOpen} title="展开历史记录" className="-translate-y-1" />

          <div className="my-1 h-px w-8 bg-[var(--theme-border-primary)]" />

          <MiniSidebarButton onClick={onNewChat} icon={SquarePen} title="新建对话" />
          <MiniSidebarButton onClick={handleMiniSearchClick} icon={Search} title="搜索对话" />
          <button
            ref={recentChatsButtonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsRecentChatsOpen((value) => !value);
            }}
            className={SIDEBAR_ICON_BUTTON_CLASS}
            title="最近对话"
            aria-label="最近对话"
            aria-haspopup="dialog"
            aria-expanded={isRecentChatsOpen}
          >
            <MessageSquare size={20} strokeWidth={2} />
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
              className="fixed left-[52.2px] top-[60px] z-[60] w-[320px] overflow-hidden rounded-2xl border border-[var(--theme-border-primary)] bg-[var(--theme-bg-primary)] shadow-2xl"
              role="dialog"
              aria-label="最近对话"
            >
              <div className="px-4 py-3 text-sm font-medium text-[var(--theme-text-secondary)]">最近对话</div>
              <div className="max-h-[min(420px,calc(100vh-120px))] overflow-y-auto py-1 custom-scrollbar">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        onSelectSession(session.id);
                        setIsRecentChatsOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)] focus:bg-[var(--theme-bg-tertiary)] focus:outline-none"
                    >
                      <span className="block truncate" title={session.title}>
                        {session.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-[var(--theme-text-tertiary)]">暂无对话记录</p>
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
