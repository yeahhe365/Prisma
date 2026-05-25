import React, { type Dispatch, type RefObject, type SetStateAction, useMemo } from 'react';
import {
  ChevronDown,
  Copy,
  Download,
  MoreHorizontal,
  Pin,
  PinOff,
  SquarePen,
  Trash2,
} from 'lucide-react';
import type { ChatGroup, ChatSession } from '@/types';

type SessionListProps = {
  activeMenuId: string | null;
  currentSessionId: string | null;
  filteredSessions: ChatSession[];
  groups: ChatGroup[];
  editingGroup: { id: string; title: string } | null;
  editingSession: { id: string; title: string } | null;
  groupEditInputRef: RefObject<HTMLInputElement | null>;
  sessionEditInputRef: RefObject<HTMLInputElement | null>;
  dragOverGroupId: string | null;
  onClose: () => void;
  onDeleteSession: (id: string, event: React.MouseEvent) => void;
  onDeleteGroup: (id: string) => void;
  onDuplicateSession: (id: string) => void;
  onEmptySpaceClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onExportSession: (id: string) => void;
  onGroupEditChange: (title: string) => void;
  onGroupEditConfirm: () => void;
  onGroupEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onMoveSessionToGroup: (sessionId: string, groupId: string | null) => void;
  onRenameGroupStart: (group: ChatGroup) => void;
  onRenameSessionStart: (session: ChatSession) => void;
  onSelectSession: (id: string) => void;
  onSessionEditChange: (title: string) => void;
  onSessionEditConfirm: () => void;
  onSessionEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onTogglePinSession: (id: string) => void;
  onToggleGroupExpansion: (id: string) => void;
  sessionMenuRef: RefObject<HTMLDivElement | null>;
  sessions: ChatSession[];
  setActiveMenuId: Dispatch<SetStateAction<string | null>>;
  setDragOverGroupId: Dispatch<SetStateAction<string | null>>;
};

type SessionBucket = {
  title: string;
  sessions: ChatSession[];
};

const getSessionTime = (session: ChatSession) => session.createdAt || 0;

const sortSessions = (items: ChatSession[]) =>
  [...items].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return getSessionTime(b) - getSessionTime(a);
  });

const categorizeSessionsByDate = (items: ChatSession[]): SessionBucket[] => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const sevenDaysAgoStart = new Date(todayStart);
  sevenDaysAgoStart.setDate(todayStart.getDate() - 8);
  const thirtyDaysAgoStart = new Date(todayStart);
  thirtyDaysAgoStart.setDate(todayStart.getDate() - 30);

  const buckets = new Map<string, ChatSession[]>();

  sortSessions(items).forEach((session) => {
    const sessionDate = new Date(getSessionTime(session));
    const title =
      sessionDate >= todayStart
        ? '今天'
        : sessionDate >= yesterdayStart
          ? '昨天'
          : sessionDate >= sevenDaysAgoStart
            ? '近 7 天'
            : sessionDate >= thirtyDaysAgoStart
              ? '近 30 天'
              : new Intl.DateTimeFormat('zh-CN-u-nu-hanidec', {
                  year: 'numeric',
                  month: 'long',
                }).format(sessionDate);

    buckets.set(title, [...(buckets.get(title) || []), session]);
  });

  return Array.from(buckets, ([title, sessions]) => ({ title, sessions }));
};

const menuItemClasses =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors focus:outline-none';

const SessionRow = ({
  activeMenuId,
  currentSessionId,
  editingSession,
  onClose,
  onDeleteSession,
  onDuplicateSession,
  onExportSession,
  onRenameSessionStart,
  onSelectSession,
  onSessionEditChange,
  onSessionEditConfirm,
  onSessionEditKeyDown,
  onTogglePinSession,
  session,
  sessionEditInputRef,
  sessionMenuRef,
  setActiveMenuId,
}: {
  activeMenuId: string | null;
  currentSessionId: string | null;
  editingSession: { id: string; title: string } | null;
  onClose: () => void;
  onDeleteSession: (id: string, event: React.MouseEvent) => void;
  onDuplicateSession: (id: string) => void;
  onExportSession: (id: string) => void;
  onRenameSessionStart: (session: ChatSession) => void;
  onSelectSession: (id: string) => void;
  onSessionEditChange: (title: string) => void;
  onSessionEditConfirm: () => void;
  onSessionEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onTogglePinSession: (id: string) => void;
  session: ChatSession;
  sessionEditInputRef: RefObject<HTMLInputElement | null>;
  sessionMenuRef: RefObject<HTMLDivElement | null>;
  setActiveMenuId: Dispatch<SetStateAction<string | null>>;
}) => (
  <div
    data-session-row
    draggable
    onContextMenu={(event) => {
      event.preventDefault();
      setActiveMenuId(session.id);
    }}
    onDragStart={(event) => {
      event.dataTransfer.setData('sessionId', session.id);
      event.dataTransfer.effectAllowed = 'move';
    }}
    className={`group relative my-0.5 rounded-lg transition-colors duration-100 ease-out ${
      currentSessionId === session.id ? 'bg-[var(--theme-bg-tertiary)]' : ''
    } ${activeMenuId === session.id ? 'z-20' : ''}`}
  >
    <div
      className={`relative w-full rounded-lg py-2 pl-2.5 pr-1 text-left text-sm transition-colors ${
        currentSessionId === session.id
          ? 'text-[var(--theme-text-primary)]'
          : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)]'
      }`}
    >
      {editingSession?.id === session.id ? (
        <input
          ref={sessionEditInputRef}
          type="text"
          value={editingSession.title}
          onChange={(event) => onSessionEditChange(event.target.value)}
          onBlur={onSessionEditConfirm}
          onKeyDown={onSessionEditKeyDown}
          onClick={(event) => event.stopPropagation()}
          className="w-full rounded-md border border-[var(--theme-border-focus)] bg-transparent px-1 py-0 text-sm font-medium text-[var(--theme-text-primary)] outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            onSelectSession(session.id);
            if (window.innerWidth < 1024) onClose();
          }}
          className="flex w-full min-w-0 items-center pr-8 text-inherit"
          aria-current={currentSessionId === session.id ? 'page' : undefined}
        >
          {session.isPinned && (
            <Pin
              size={12}
              className="mr-2 shrink-0 text-[var(--theme-text-link)]"
              strokeWidth={2}
            />
          )}
          <span className="truncate font-medium" title={session.title}>
            {session.title}
          </span>
        </button>
      )}
    </div>
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setActiveMenuId((currentMenuId) => (currentMenuId === session.id ? null : session.id));
      }}
      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--theme-text-tertiary)] opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-border-focus)]"
      aria-label={`打开 ${session.title} 操作菜单`}
      aria-haspopup="menu"
      aria-expanded={activeMenuId === session.id}
    >
      <MoreHorizontal size={16} strokeWidth={2} />
    </button>
    {activeMenuId === session.id && (
      <div
        ref={sessionMenuRef}
        className="absolute right-3 top-9 z-10 w-40 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-primary)] py-1 shadow-lg"
        role="menu"
        aria-label={`${session.title} 操作`}
      >
        <button
          type="button"
          onClick={() => {
            onRenameSessionStart(session);
            setActiveMenuId(null);
          }}
          className={`${menuItemClasses} text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:bg-[var(--theme-bg-tertiary)]`}
          role="menuitem"
        >
          <SquarePen size={14} strokeWidth={2} />
          <span>编辑</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onTogglePinSession(session.id);
            setActiveMenuId(null);
          }}
          className={`${menuItemClasses} text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:bg-[var(--theme-bg-tertiary)]`}
          role="menuitem"
        >
          {session.isPinned ? (
            <PinOff size={14} strokeWidth={2} />
          ) : (
            <Pin size={14} strokeWidth={2} />
          )}
          <span>{session.isPinned ? '取消置顶' : '置顶'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onDuplicateSession(session.id);
            setActiveMenuId(null);
          }}
          className={`${menuItemClasses} text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:bg-[var(--theme-bg-tertiary)]`}
          role="menuitem"
        >
          <Copy size={14} strokeWidth={2} />
          <span>创建副本</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onExportSession(session.id);
            setActiveMenuId(null);
          }}
          className={`${menuItemClasses} text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:bg-[var(--theme-bg-tertiary)]`}
          role="menuitem"
          title="导出对话"
        >
          <Download size={14} strokeWidth={2} />
          <span>导出对话</span>
        </button>
        <button
          type="button"
          onClick={(event) => {
            onDeleteSession(session.id, event);
            setActiveMenuId(null);
          }}
          className={`${menuItemClasses} text-[var(--theme-text-danger)] hover:bg-[var(--theme-bg-danger)]/10 focus:bg-[var(--theme-bg-danger)]/10`}
          role="menuitem"
        >
          <Trash2 size={14} strokeWidth={2} />
          <span>删除</span>
        </button>
      </div>
    )}
  </div>
);

const SessionRows = ({
  sessions,
  ...rowProps
}: Omit<React.ComponentProps<typeof SessionRow>, 'session'> & { sessions: ChatSession[] }) => (
  <div>
    {sessions.map((session) => (
      <SessionRow key={session.id} session={session} {...rowProps} />
    ))}
  </div>
);

const SessionList = ({
  activeMenuId,
  currentSessionId,
  dragOverGroupId,
  editingGroup,
  editingSession,
  filteredSessions,
  groupEditInputRef,
  groups,
  onClose,
  onDeleteGroup,
  onDeleteSession,
  onDuplicateSession,
  onEmptySpaceClick,
  onExportSession,
  onGroupEditChange,
  onGroupEditConfirm,
  onGroupEditKeyDown,
  onMoveSessionToGroup,
  onRenameGroupStart,
  onRenameSessionStart,
  onSelectSession,
  onSessionEditChange,
  onSessionEditConfirm,
  onSessionEditKeyDown,
  onTogglePinSession,
  onToggleGroupExpansion,
  sessionEditInputRef,
  sessionMenuRef,
  sessions,
  setActiveMenuId,
  setDragOverGroupId,
}: SessionListProps) => {
  const groupsById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);
  const sessionsByGroupId = useMemo(() => {
    const map = new Map<string | null, ChatSession[]>();
    map.set(null, []);
    groups.forEach((group) => map.set(group.id, []));
    filteredSessions.forEach((session) => {
      const key = session.groupId && groupsById.has(session.groupId) ? session.groupId : null;
      map.set(key, [...(map.get(key) || []), session]);
    });
    map.forEach((items, key) => map.set(key, sortSessions(items)));
    return map;
  }, [filteredSessions, groups, groupsById]);
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => b.createdAt - a.createdAt),
    [groups],
  );
  const ungroupedSessions = useMemo(
    () => sessionsByGroupId.get(null) || [],
    [sessionsByGroupId],
  );
  const pinnedUngroupedSessions = useMemo(
    () => ungroupedSessions.filter((session) => session.isPinned),
    [ungroupedSessions],
  );
  const ungroupedBuckets = useMemo(
    () => categorizeSessionsByDate(ungroupedSessions.filter((session) => !session.isPinned)),
    [ungroupedSessions],
  );

  const handleDrop = (event: React.DragEvent, groupId: string | null) => {
    event.preventDefault();
    event.stopPropagation();
    const sessionId = event.dataTransfer.getData('sessionId');
    if (sessionId) {
      onMoveSessionToGroup(sessionId, groupId);
    }
    setDragOverGroupId(null);
  };

  const rowProps = {
    activeMenuId,
    currentSessionId,
    editingSession,
    onClose,
    onDeleteSession,
    onDuplicateSession,
    onExportSession,
    onRenameSessionStart,
    onSelectSession,
    onSessionEditChange,
    onSessionEditConfirm,
    onSessionEditKeyDown,
    onTogglePinSession,
    sessionEditInputRef,
    sessionMenuRef,
    setActiveMenuId,
  };

  const hasGroups = sortedGroups.length > 0;
  const hasAnySessions = sessions.length > 0;
  const hasVisibleSessions = filteredSessions.length > 0;

  return (
    <div
      data-sidebar-session-scroller
      className="custom-scrollbar flex-grow cursor-ew-resize overflow-y-auto p-2"
      onClick={onEmptySpaceClick}
    >
      {!hasAnySessions && !hasGroups ? (
        <p className="cursor-auto p-4 text-center text-xs text-[var(--theme-text-tertiary)] sm:text-sm">
          暂无对话记录
        </p>
      ) : !hasVisibleSessions && !hasGroups ? (
        <p className="cursor-auto p-4 text-center text-xs text-[var(--theme-text-tertiary)] sm:text-sm">
          未找到结果
        </p>
      ) : (
        <div
          data-sidebar-session-list
          className={`min-h-[50px] cursor-auto rounded-lg transition-colors ${
            dragOverGroupId === 'all-conversations'
              ? 'bg-[var(--theme-bg-accent)]/10 ring-2 ring-[var(--theme-bg-accent)]/50 ring-inset'
              : ''
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDragEnter={() => setDragOverGroupId('all-conversations')}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setDragOverGroupId(null);
          }}
          onDrop={(event) => handleDrop(event, null)}
        >
          {sortedGroups.map((group) => {
            const groupSessions = sessionsByGroupId.get(group.id) || [];
            const isExpanded = group.isExpanded ?? true;
            const isGroupMenuOpen = activeMenuId === group.id;

            return (
              <div
                key={group.id}
                data-group-row
                className={`mb-1 rounded-lg transition-all duration-200 ${
                  dragOverGroupId === group.id
                    ? 'bg-[var(--theme-bg-accent)]/20 ring-2 ring-[var(--theme-bg-accent)]/50 ring-inset'
                    : ''
                } ${isGroupMenuOpen ? 'relative z-20' : 'relative z-0'}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragOverGroupId(group.id);
                }}
                onDragLeave={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                  setDragOverGroupId(null);
                }}
                onDrop={(event) => handleDrop(event, group.id)}
              >
                <div className="group flex items-center justify-between rounded-lg px-1 py-2 transition-colors hover:bg-[var(--theme-bg-tertiary)]">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleGroupExpansion(group.id);
                    }}
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[var(--theme-text-tertiary)] transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2}
                    />
                    {editingGroup?.id === group.id ? (
                      <input
                        ref={groupEditInputRef}
                        type="text"
                        value={editingGroup.title}
                        onChange={(event) => onGroupEditChange(event.target.value)}
                        onBlur={onGroupEditConfirm}
                        onKeyDown={onGroupEditKeyDown}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full rounded-md border border-[var(--theme-border-focus)] bg-transparent px-1 py-0 text-sm font-semibold text-[var(--theme-text-primary)] outline-none"
                      />
                    ) : (
                      <span className="truncate text-sm font-semibold text-[var(--theme-text-secondary)]">
                        {group.title}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveMenuId((id) => (id === group.id ? null : group.id));
                    }}
                    className="rounded-full p-1 text-[var(--theme-text-tertiary)] opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-border-focus)]"
                    aria-label={`打开 ${group.title} 分组菜单`}
                    aria-haspopup="menu"
                    aria-expanded={isGroupMenuOpen}
                  >
                    <MoreHorizontal size={16} strokeWidth={2} />
                  </button>
                </div>

                {isGroupMenuOpen && (
                  <div ref={sessionMenuRef} className="relative z-10">
                    <div
                      className="absolute right-3 -top-1 w-40 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-primary)] py-1 shadow-lg"
                      role="menu"
                      aria-label={`${group.title} 分组操作`}
                    >
                      <button
                        type="button"
                        className={`${menuItemClasses} text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:bg-[var(--theme-bg-tertiary)]`}
                        role="menuitem"
                        onClick={() => {
                          onRenameGroupStart(group);
                          setActiveMenuId(null);
                        }}
                      >
                        <SquarePen size={14} strokeWidth={2} />
                        <span>编辑</span>
                      </button>
                      <button
                        type="button"
                        className={`${menuItemClasses} text-[var(--theme-text-danger)] hover:bg-[var(--theme-bg-danger)]/10 focus:bg-[var(--theme-bg-danger)]/10`}
                        role="menuitem"
                        onClick={() => {
                          onDeleteGroup(group.id);
                          setActiveMenuId(null);
                        }}
                      >
                        <Trash2 size={14} strokeWidth={2} />
                        <span>删除</span>
                      </button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="pb-1 pl-1">
                    <SessionRows sessions={groupSessions} {...rowProps} />
                  </div>
                )}
              </div>
            );
          })}

          {pinnedUngroupedSessions.length > 0 && (
            <div>
              <div className="px-3 pb-1 pt-4 text-sm font-medium text-[var(--theme-text-primary)]">
                已置顶
              </div>
              <SessionRows sessions={pinnedUngroupedSessions} {...rowProps} />
            </div>
          )}

          {ungroupedBuckets.map((bucket) => (
            <div key={bucket.title}>
              <div className="px-3 pb-1 pt-4 text-sm font-medium text-[var(--theme-text-primary)]">
                {bucket.title}
              </div>
              <SessionRows sessions={bucket.sessions} {...rowProps} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionList;
