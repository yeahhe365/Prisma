import { useCallback, useEffect, useRef, useState } from 'react';

export const useCopyToClipboard = (resetDelay = 2000) => {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = undefined;
    }
  }, []);

  const copy = useCallback(
    async (text: string) => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        clearResetTimer();
        setCopied(true);
        resetTimerRef.current = setTimeout(() => {
          setCopied(false);
          resetTimerRef.current = undefined;
        }, resetDelay);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [clearResetTimer, resetDelay],
  );

  useEffect(() => clearResetTimer, [clearResetTimer]);

  return { copied, copy };
};
