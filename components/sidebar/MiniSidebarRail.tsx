import { History as HistoryIcon, Search, Settings, SquarePen } from 'lucide-react';
import type { FocusEvent, RefObject } from 'react';
import MiniSidebarButton from '@/components/sidebar/MiniSidebarButton';
import SidebarToggleIcon from '@/components/sidebar/SidebarToggleIcon';
import {
  SIDEBAR_ICON_BUTTON_CLASS,
  SIDEBAR_RAIL_ICON_GAP_CLASS,
  SIDEBAR_RAIL_MIN_WIDTH_CLASS,
  type RecentChatsOpenMode,
} from '@/components/sidebar/sidebarConstants';

type MiniSidebarRailProps = {
  clearRecentChatsCloseTimer: () => void;
  closeRecentChats: () => void;
  handleRecentChatsButtonBlur: (event: FocusEvent<HTMLButtonElement>) => void;
  isOpen: boolean;
  isRecentChatsOpen: boolean;
  onNewChat: () => void;
  onOpen: () => void;
  onOpenSettings: () => void;
  openRecentChats: (mode: RecentChatsOpenMode) => void;
  recentChatsButtonRef: RefObject<HTMLButtonElement | null>;
  recentChatsOpenMode: RecentChatsOpenMode | null;
  scheduleRecentChatsClose: () => void;
  onSearchClick: () => void;
};

const MiniSidebarRail = ({
  clearRecentChatsCloseTimer,
  closeRecentChats,
  handleRecentChatsButtonBlur,
  isOpen,
  isRecentChatsOpen,
  onNewChat,
  onOpen,
  onOpenSettings,
  openRecentChats,
  recentChatsButtonRef,
  recentChatsOpenMode,
  scheduleRecentChatsClose,
  onSearchClick,
}: MiniSidebarRailProps) => (
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
      icon={SidebarToggleIcon}
      title="展开历史记录"
      className="-translate-y-1"
    />

    <div className="my-1 h-px w-8 bg-[var(--theme-border-primary)]" />

    <MiniSidebarButton onClick={onNewChat} icon={SquarePen} title="新建对话" />
    <MiniSidebarButton onClick={onSearchClick} icon={Search} title="搜索对话" />
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
      onBlur={handleRecentChatsButtonBlur}
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
);

export default MiniSidebarRail;
