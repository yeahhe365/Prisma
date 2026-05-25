import { useEffect, useRef, useState } from 'react';

const FENCED_CODE_BLOCK_REGEX = /(```[\s\S]*?```|```[\s\S]*$)/g;
const GFM_TABLE_REGEX = /(?:^|\n)\|[^\n]*\|\s*\n\|(?:\s*:?-{3,}:?\s*\|)+/;
const HTML_STREAM_START_REGEX =
  /^\s*(?:<!doctype\s+html\b[^>]*>\s*)?(?:<html\b|<head\b|<body\b|<(?:article|aside|blockquote|div|main|section|table|ul|ol|p|details|figure|header|footer|nav)\b)/i;
const LIVE_ARTIFACT_JSON_STREAM_REGEX =
  /^\s*\{[\s\S]*"instruction"[\s\S]*"schema"|^\s*```amc-live-artifact-interaction\b[\s\S]*"instruction"[\s\S]*"schema"/i;

const hasStreamingSensitiveMarkdownTable = (text: string) =>
  text.split(FENCED_CODE_BLOCK_REGEX).some((segment, index) => index % 2 === 0 && GFM_TABLE_REGEX.test(segment));

const shouldBypassStreamingAnimation = (text: string) => {
  if (typeof document !== 'undefined' && document.hidden) return true;
  return (
    hasStreamingSensitiveMarkdownTable(text) ||
    HTML_STREAM_START_REGEX.test(text) ||
    LIVE_ARTIFACT_JSON_STREAM_REGEX.test(text)
  );
};

type FrameHandle = { type: 'raf' | 'timeout'; id: number };

const requestFrame = (callback: (time: DOMHighResTimeStamp) => void): FrameHandle => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    return { type: 'raf', id: window.requestAnimationFrame(callback) };
  }

  const id = window.setTimeout(() => callback(performance.now()), 16);
  return { type: 'timeout', id };
};

const cancelFrame = (handle: FrameHandle | null) => {
  if (!handle || typeof window === 'undefined') return;

  if (handle.type === 'raf' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(handle.id);
    return;
  }

  window.clearTimeout(handle.id);
};

export const useSmoothStreaming = (text: string | undefined | null, isStreaming: boolean) => {
  const safeText = text || '';
  const shouldBypassAnimation = isStreaming && shouldBypassStreamingAnimation(safeText);
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : safeText);
  const displayedTextRef = useRef(isStreaming ? '' : safeText);
  const targetTextRef = useRef(safeText);
  const frameRef = useRef<FrameHandle | null>(null);
  const lastRenderTimeRef = useRef(0);

  useEffect(() => {
    targetTextRef.current = safeText;

    if (shouldBypassAnimation || !isStreaming) {
      displayedTextRef.current = safeText;
      setDisplayedText(safeText);
      cancelFrame(frameRef.current);
      frameRef.current = null;
    }
  }, [isStreaming, safeText, shouldBypassAnimation]);

  useEffect(() => {
    if (!isStreaming || shouldBypassAnimation) return undefined;

    const animate = (time: DOMHighResTimeStamp) => {
      if (typeof document !== 'undefined' && document.hidden) {
        frameRef.current = null;
        return;
      }

      const currentLength = displayedTextRef.current.length;
      const targetLength = targetTextRef.current.length;

      if (currentLength < targetLength) {
        const lag = targetLength - currentLength;
        let charsToAdd = 1;
        if (lag > 200) charsToAdd = 15;
        else if (lag > 100) charsToAdd = 8;
        else if (lag > 50) charsToAdd = 5;
        else if (lag > 20) charsToAdd = 3;
        else if (lag > 5) charsToAdd = 2;

        const nextText = targetTextRef.current.slice(0, currentLength + charsToAdd);
        displayedTextRef.current = nextText;

        const caughtUp = nextText.length >= targetLength;
        if (caughtUp || time - lastRenderTimeRef.current > 60) {
          setDisplayedText(nextText);
          lastRenderTimeRef.current = time;
        }

        frameRef.current = caughtUp ? null : requestFrame(animate);
        return;
      }

      if (currentLength > targetLength) {
        displayedTextRef.current = targetTextRef.current;
        setDisplayedText(targetTextRef.current);
        lastRenderTimeRef.current = time;
      }
      frameRef.current = null;
    };

    if (!frameRef.current && displayedTextRef.current !== targetTextRef.current) {
      frameRef.current = requestFrame(animate);
    }

    return () => {
      cancelFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [isStreaming, safeText, shouldBypassAnimation]);

  return shouldBypassAnimation ? safeText : isStreaming ? displayedText : safeText;
};
