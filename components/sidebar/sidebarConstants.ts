export const SIDEBAR_ICON_BUTTON_CLASS =
  'flex items-center justify-center p-2.5 rounded-xl text-[var(--theme-icon-history)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]';

export const SIDEBAR_ACTION_ROW_CLASS =
  'group flex h-8 w-full items-center gap-3 rounded-full bg-transparent px-3 text-left text-sm transition-colors hover:bg-[var(--theme-bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-border-focus)]';

export const RECENT_CHATS_CLOSE_DELAY_MS = 120;
export const RECENT_CHATS_PANEL_WIDTH = 320;
export const RECENT_CHATS_PANEL_GAP = 0;
export const RECENT_CHATS_PANEL_MARGIN = 16;
export const SIDEBAR_EXPANDED_WIDTH_CLASS = 'md:w-[16.2rem]';
export const SIDEBAR_EXPANDED_MIN_WIDTH_CLASS = 'md:min-w-[16.2rem]';
export const SIDEBAR_RAIL_WIDTH_CLASS = 'md:w-[52.2px]';
export const SIDEBAR_RAIL_MIN_WIDTH_CLASS = 'min-w-[52.2px]';
export const SIDEBAR_RAIL_ICON_GAP_CLASS = 'gap-[0.56rem]';

export type RecentChatsOpenMode = 'hover' | 'focus' | 'click';
