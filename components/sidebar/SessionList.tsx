import React, { type Dispatch, type RefObject, type SetStateAction } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import type { ChatSession } from '@/types';

type SessionListProps = {
  activeSessionMenuId: string | null;
  currentSessionId: string | null;
  filteredSessions: ChatSession[];
  onClose: () => void;
  onDeleteSession: (id: string, event: React.MouseEvent) => void;
  onEmptySpaceClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onSelectSession: (id: string) => void;
  sessionMenuRef: RefObject<HTMLDivElement | null>;
  sessions: ChatSession[];
  setActiveSessionMenuId: Dispatch<SetStateAction<string | null>>;
};

const SessionList = ({
  activeSessionMenuId,
  currentSessionId,
  filteredSessions,
  onClose,
  onDeleteSession,
  onEmptySpaceClick,
  onSelectSession,
  sessionMenuRef,
  sessions,
  setActiveSessionMenuId,
}: SessionListProps) => (
  <div
    data-sidebar-session-scroller
    className="custom-scrollbar flex-grow cursor-ew-resize overflow-y-auto p-2"
    onClick={onEmptySpaceClick}
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
);

export default SessionList;
