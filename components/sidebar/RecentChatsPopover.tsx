import { createPortal } from 'react-dom';
import type { CSSProperties, RefObject } from 'react';
import type { ChatSession } from '@/types';
import type { RecentChatsOpenMode } from '@/components/sidebar/sidebarConstants';

type RecentChatsPopoverProps = {
  clearRecentChatsCloseTimer: () => void;
  closeRecentChats: () => void;
  isOpen: boolean;
  onSelectSession: (id: string) => void;
  openRecentChats: (mode: RecentChatsOpenMode) => void;
  recentChatsOpenMode: RecentChatsOpenMode | null;
  recentChatsPanelPosition: CSSProperties;
  recentChatsPanelRef: RefObject<HTMLDivElement | null>;
  recentSessions: ChatSession[];
  scheduleRecentChatsClose: () => void;
};

const RecentChatsPopover = ({
  clearRecentChatsCloseTimer,
  closeRecentChats,
  isOpen,
  onSelectSession,
  openRecentChats,
  recentChatsOpenMode,
  recentChatsPanelPosition,
  recentChatsPanelRef,
  recentSessions,
  scheduleRecentChatsClose,
}: RecentChatsPopoverProps) => {
  if (!isOpen) return null;

  return createPortal(
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
          <p className="px-4 py-3 text-sm text-[var(--theme-text-tertiary)]">暂无对话记录</p>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default RecentChatsPopover;
