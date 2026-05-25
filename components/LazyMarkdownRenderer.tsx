import React, { Suspense } from 'react';
import { useSmoothStreaming } from '@/hooks/useSmoothStreaming';

const MarkdownRenderer = React.lazy(() => import('@/components/MarkdownRenderer'));

interface LazyMarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

const MarkdownFallback = ({ content, className }: LazyMarkdownRendererProps) => (
  <div
    className={`whitespace-pre-wrap break-words text-[var(--theme-text-secondary)] ${className || ''}`.trim()}
  >
    {content}
  </div>
);

const LazyMarkdownRenderer = ({ content, className, isStreaming = false }: LazyMarkdownRendererProps) => {
  const displayedContent = useSmoothStreaming(content, isStreaming);

  return (
    <Suspense fallback={<MarkdownFallback content={displayedContent} className={className} />}>
      <MarkdownRenderer content={displayedContent} className={className} isStreaming={isStreaming} />
    </Suspense>
  );
};

export default LazyMarkdownRenderer;
