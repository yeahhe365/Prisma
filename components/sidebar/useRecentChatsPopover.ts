import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from 'react';
import {
  RECENT_CHATS_CLOSE_DELAY_MS,
  RECENT_CHATS_PANEL_GAP,
  RECENT_CHATS_PANEL_MARGIN,
  RECENT_CHATS_PANEL_WIDTH,
  type RecentChatsOpenMode,
} from '@/components/sidebar/sidebarConstants';

export const useRecentChatsPopover = () => {
  const [isRecentChatsOpen, setIsRecentChatsOpen] = useState(false);
  const [recentChatsOpenMode, setRecentChatsOpenMode] = useState<RecentChatsOpenMode | null>(null);
  const [recentChatsPanelPosition, setRecentChatsPanelPosition] = useState<CSSProperties>({});
  const recentChatsButtonRef = useRef<HTMLButtonElement>(null);
  const recentChatsPanelRef = useRef<HTMLDivElement>(null);
  const recentChatsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleRecentChatsButtonBlur = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      const nextFocusTarget = event.relatedTarget as Node | null;
      if (
        nextFocusTarget &&
        ((recentChatsButtonRef.current && recentChatsButtonRef.current.contains(nextFocusTarget)) ||
          (recentChatsPanelRef.current && recentChatsPanelRef.current.contains(nextFocusTarget)))
      ) {
        return;
      }
      if (recentChatsOpenMode === 'focus') {
        scheduleRecentChatsClose();
      }
    },
    [recentChatsOpenMode, scheduleRecentChatsClose],
  );

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

  return {
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
  };
};
