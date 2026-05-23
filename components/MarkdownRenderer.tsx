import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDarkReasonable } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown';
import plaintext from 'react-syntax-highlighter/dist/esm/languages/hljs/plaintext';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

type CodeBlockProps = React.ComponentPropsWithoutRef<'code'> & {
  node?: unknown;
};

[
  ['bash', bash],
  ['sh', bash],
  ['shell', bash],
  ['zsh', bash],
  ['css', css],
  ['javascript', javascript],
  ['js', javascript],
  ['json', json],
  ['markdown', markdown],
  ['md', markdown],
  ['plaintext', plaintext],
  ['text', plaintext],
  ['python', python],
  ['py', python],
  ['sql', sql],
  ['typescript', typescript],
  ['ts', typescript],
  ['tsx', typescript],
  ['jsx', javascript],
  ['xml', xml],
  ['html', xml],
  ['yaml', yaml],
  ['yml', yaml],
].forEach(([name, language]) => {
  SyntaxHighlighter.registerLanguage(name, language);
});

const CodeBlock = ({ node: _node, className, children, ...props }: CodeBlockProps) => {
  const [expanded, setExpanded] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isInline = !className;

  // Inline code (e.g. `const x = 1`)
  if (isInline) {
    return (
      <code
        className={`${className} rounded border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-info)] px-1 py-0.5 font-mono text-sm text-[var(--theme-text-link)]`}
        {...props}
      >
        {children}
      </code>
    );
  }

  const codeString = String(children).replace(/\n$/, '');
  const lineCount = codeString.split('\n').length;
  const isLong = lineCount > 15;
  const MAX_HEIGHT = 400;

  const handleCopy = () => {
    copy(codeString);
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-code-block)] shadow-sm">
      {/* Code Header */}
      <div className="flex items-center justify-between border-b border-[var(--theme-border-secondary)] bg-[var(--theme-bg-code-block-header)] px-3 py-2 text-xs text-[var(--theme-text-tertiary)]">
        <div className="flex items-center gap-2">
          <Terminal size={14} />
          <span className="font-mono text-[var(--theme-text-secondary)]">{language || 'text'}</span>
          <span className="text-[10px] text-[var(--theme-text-tertiary)]">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-2">
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 transition-colors hover:text-[var(--theme-text-primary)]"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{expanded ? 'Collapse' : 'Expand'}</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 transition-colors hover:text-[var(--theme-text-primary)]"
          >
            {copied ? <Check size={14} className="text-[var(--theme-text-success)]" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Syntax Highlighter */}
      <div
        className="overflow-x-auto"
        style={!expanded && isLong ? { maxHeight: MAX_HEIGHT, overflowY: 'auto' } : {}}
      >
        {!expanded && isLong && (
          <div className="pointer-events-none sticky top-0 z-10 h-6 bg-gradient-to-b from-[var(--theme-bg-code-block)] to-transparent" />
        )}
        <SyntaxHighlighter
          language={language}
          style={atomOneDarkReasonable}
          showLineNumbers={lineCount > 3}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#555',
            userSelect: 'none',
          }}
          codeTagProps={{
            style: { fontFamily: 'JetBrains Mono, monospace' },
          }}
          wrapLines={true}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const MarkdownRenderer = ({ content, className }: { content: string; className?: string }) => {
  /**
   * Pre-process content to handle common LaTeX delimiters from Gemini
   * and optimize Markdown compatibility.
   */
  const preprocessMarkdown = (text: string) => {
    if (!text) return '';

    return (
      text
        // Replace \[ ... \] with $$ ... $$
        .replace(/\\\[/g, '$$$$')
        .replace(/\\\]/g, '$$$$')
        // Replace \( ... \) with $ ... $
        .replace(/\\\(/g, '$$')
        .replace(/\\\)/g, '$$')
        // Fix potential spacing issues between bold marks and math delimiters
        .replace(/\*\*(\$)/g, '** $1')
        .replace(/(\$)\*\*/g, '$1 **')
    );
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          code: CodeBlock,
        }}
      >
        {preprocessMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
