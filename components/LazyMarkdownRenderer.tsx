import React, { Suspense } from 'react';

const MarkdownRenderer = React.lazy(() => import('./MarkdownRenderer'));

interface LazyMarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownFallback = ({ content, className }: LazyMarkdownRendererProps) => (
  <pre className={`whitespace-pre-wrap break-words ${className || ''}`.trim()}>{content}</pre>
);

const LazyMarkdownRenderer = ({ content, className }: LazyMarkdownRendererProps) => {
  return (
    <Suspense fallback={<MarkdownFallback content={content} className={className} />}>
      <MarkdownRenderer content={content} className={className} />
    </Suspense>
  );
};

export default LazyMarkdownRenderer;
