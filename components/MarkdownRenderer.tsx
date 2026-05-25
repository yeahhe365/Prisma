import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { Copy, Check, Terminal, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

type CodeBlockProps = React.ComponentPropsWithoutRef<'code'> & {
  node?: unknown;
};
type PreBlockProps = React.ComponentPropsWithoutRef<'pre'> & {
  node?: unknown;
};
type TableBlockProps = React.ComponentPropsWithoutRef<'table'> & {
  node?: unknown;
};
type AnchorProps = React.ComponentPropsWithoutRef<'a'>;
type CodeElementProps = {
  className?: string;
  children?: React.ReactNode;
};

const MAX_COLLAPSED_CODE_BLOCK_HEIGHT = 400;
const URL_PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const LANGUAGE_DEFINITIONS = [
  { aliases: ['bash', 'sh', 'shell', 'zsh'], extension: 'sh', grammar: bash },
  { aliases: ['css'], extension: 'css', grammar: css },
  { aliases: ['javascript', 'js', 'jsx'], extension: 'js', grammar: javascript },
  { aliases: ['json'], extension: 'json', grammar: json },
  { aliases: ['markdown', 'md'], extension: 'md', grammar: markdown },
  { aliases: ['plaintext', 'text'], extension: 'txt', grammar: plaintext },
  { aliases: ['python', 'py'], extension: 'py', grammar: python },
  { aliases: ['sql'], extension: 'sql', grammar: sql },
  { aliases: ['typescript', 'ts'], extension: 'ts', grammar: typescript },
  { aliases: ['tsx'], extension: 'tsx', grammar: typescript },
  { aliases: ['xml', 'html'], extension: 'xml', grammar: xml },
  { aliases: ['yaml', 'yml'], extension: 'yml', grammar: yaml },
] as const;

const DOWNLOAD_EXTENSION_BY_LANGUAGE = LANGUAGE_DEFINITIONS.reduce<Record<string, string>>(
  (extensions, definition) => {
    definition.aliases.forEach((alias) => {
      extensions[alias] = definition.extension;
      SyntaxHighlighter.registerLanguage(alias, definition.grammar);
    });
    return extensions;
  },
  {},
);
DOWNLOAD_EXTENSION_BY_LANGUAGE.html = 'html';
DOWNLOAD_EXTENSION_BY_LANGUAGE.jsx = 'jsx';

const codeHeaderButtonClasses =
  'inline-flex min-h-10 min-w-10 items-center justify-center rounded-md p-0 text-[var(--theme-text-tertiary)] opacity-90 transition-all duration-200 hover:bg-[var(--theme-bg-tertiary)]/40 hover:text-[var(--theme-text-primary)] hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-code-block-header)] disabled:cursor-not-allowed disabled:opacity-50';

const extractTextFromNode = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join('');
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractTextFromNode(node.props.children);
  }

  return '';
};

const getLanguageFromClassName = (className?: string) => {
  const match = /language-(\S+)/.exec(className || '');
  return match ? match[1] : '';
};

const getDownloadExtension = (language: string) => {
  const normalized = language.toLowerCase();

  return DOWNLOAD_EXTENSION_BY_LANGUAGE[normalized] || normalized || 'txt';
};

const transformMarkdownUrl = (url: string) => {
  const trimmedUrl = url.trim();

  if (
    !trimmedUrl ||
    trimmedUrl.startsWith('#') ||
    (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) ||
    trimmedUrl.startsWith('./') ||
    trimmedUrl.startsWith('../')
  ) {
    return url;
  }

  if (!URL_PROTOCOL_PATTERN.test(trimmedUrl)) {
    return url;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    return SAFE_URL_PROTOCOLS.has(parsedUrl.protocol) ? url : '';
  } catch {
    return '';
  }
};

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

const triggerDownload = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const CodeBlock = ({ node: _node, className, children, ...props }: CodeBlockProps) => {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const PreBlock = ({ children, node: _node, ...props }: PreBlockProps) => {
  const [expanded, setExpanded] = useState(false);
  const { copied, copy } = useCopyToClipboard();
  const codeElement = React.Children.toArray(children).find(
    (child): child is React.ReactElement<CodeElementProps> => {
      return (
        React.isValidElement<CodeElementProps>(child) &&
        (child.type === 'code' || Boolean(child.props.className?.includes('language-')))
      );
    },
  );
  const language = getLanguageFromClassName(codeElement?.props.className);

  const codeString = extractTextFromNode(codeElement?.props.children ?? children).replace(
    /\n$/,
    '',
  );
  const lineCount = codeString.split('\n').length;
  const isLong = lineCount > 15;
  const handleCopy = () => {
    copy(codeString);
  };

  const handleDownload = () => {
    const extension = getDownloadExtension(language);
    triggerDownload(codeString, `code.${extension}`, 'text/plain;charset=utf-8');
  };

  return (
    <div className="group relative my-3 rounded-lg border border-[var(--theme-border-primary)] bg-[var(--theme-bg-code-block)] shadow-sm">
      <div className="sticky top-0 z-10 flex select-none items-center justify-between gap-2 rounded-t-lg border-b border-[var(--theme-border-secondary)] bg-[var(--theme-bg-code-block-header)] px-3 py-0 transition-all">
        <div
          className="flex min-w-0 items-center gap-1 pl-0.5 text-[var(--theme-text-tertiary)]"
          title={language || 'text'}
          aria-label={language || 'text'}
        >
          <Terminal size={16} strokeWidth={2} />
        </div>

        <div data-code-header-toolbar className="flex flex-shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={handleDownload}
            className={codeHeaderButtonClasses}
            title={`下载 ${language || 'text'} 代码`}
            aria-label={`下载 ${language || 'text'} 代码`}
          >
            <Download size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={codeHeaderButtonClasses}
            title={copied ? '已复制' : '复制代码'}
            aria-label={copied ? '已复制' : '复制代码'}
          >
            {copied ? (
              <Check size={16} className="text-[var(--theme-text-success)]" strokeWidth={2} />
            ) : (
              <Copy size={16} strokeWidth={2} />
            )}
          </button>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={codeHeaderButtonClasses}
              aria-expanded={expanded}
              title={expanded ? '收起' : '展开'}
              aria-label={expanded ? '收起代码块' : '展开代码块'}
            >
              {expanded ? (
                <ChevronUp size={16} strokeWidth={2} />
              ) : (
                <ChevronDown size={16} strokeWidth={2} />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <pre
          className="group !m-0 !rounded-none !border-none !bg-transparent !p-0 custom-scrollbar !overflow-x-auto"
          style={{
            overflowY: expanded || !isLong ? 'visible' : 'hidden',
            maxHeight: expanded || !isLong ? 'none' : `${MAX_COLLAPSED_CODE_BLOCK_HEIGHT}px`,
          }}
          {...props}
        >
          <SyntaxHighlighter
            language={language}
            style={atomOneDarkReasonable}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.8125rem',
              lineHeight: '1.625',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            codeTagProps={{
              className: codeElement?.props.className,
              style: { fontFamily: 'JetBrains Mono, monospace', cursor: 'text' },
            }}
            wrapLines={true}
          >
            {codeString}
          </SyntaxHighlighter>
        </pre>

        {isLong && !expanded && (
          <div
            className="code-block-expand-overlay absolute bottom-0 left-0 right-0 flex h-20 cursor-pointer select-none items-end justify-center bg-gradient-to-t from-[var(--theme-bg-code-block)] to-transparent pb-2"
            onClick={() => setExpanded(true)}
          >
            <span className="flex items-center gap-1 rounded-full border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-primary)] px-3 py-1 text-xs font-medium text-[var(--theme-text-tertiary)] shadow-sm transition-colors hover:text-[var(--theme-text-primary)]">
              <ChevronDown size={12} strokeWidth={2} />
              显示更多
            </span>
          </div>
        )}

        {isLong && expanded && (
          <div className="code-block-expand-overlay pointer-events-none absolute bottom-4 left-0 right-0 z-10 flex select-none justify-center">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-tertiary)] shadow-sm transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
              title="收起"
            >
              <ChevronUp size={12} strokeWidth={2} />
              显示更少
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const getTableText = (table: HTMLTableElement) => {
  return Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.querySelectorAll('th, td')).map(
      (cell) => (cell as HTMLElement).innerText || cell.textContent || '',
    ),
  );
};

const serializeTableAsMarkdown = (table: HTMLTableElement) => {
  const rows = getTableText(table);
  if (rows.length === 0) return '';

  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => [
    ...row.map((cell) => cell.replace(/\|/g, '\\|').trim()),
    ...Array(Math.max(0, columnCount - row.length)).fill(''),
  ]);
  const [header = [], ...bodyRows] = normalizedRows;
  const separator = Array(columnCount).fill('---');

  return [header, separator, ...bodyRows].map((row) => `| ${row.join(' | ')} |`).join('\n');
};

const serializeTableAsCsv = (table: HTMLTableElement) => {
  return getTableText(table)
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

const TableBlock = ({ children, className, node: _node, ...props }: TableBlockProps) => {
  const tableRef = React.useRef<HTMLTableElement>(null);
  const { copied, copy } = useCopyToClipboard();
  const tableClassName = [className, 'min-w-full w-max text-left'].filter(Boolean).join(' ');

  const handleCopyMarkdown = () => {
    if (!tableRef.current) return;
    copy(serializeTableAsMarkdown(tableRef.current));
  };

  const handleDownloadCsv = () => {
    if (!tableRef.current) return;
    triggerDownload(
      serializeTableAsCsv(tableRef.current),
      `table-export-${Date.now()}.csv`,
      'text/csv;charset=utf-8',
    );
  };

  return (
    <div
      className="group/table relative my-4 w-full max-w-full overflow-visible rounded-xl border border-[var(--theme-border-secondary)]/70 bg-[var(--theme-bg-primary)]/40"
      data-table-actions-scope="true"
      data-testid="markdown-table-block"
    >
      <div className="custom-scrollbar w-full overflow-x-auto overflow-y-hidden">
        <table ref={tableRef} className={tableClassName} {...props}>
          {children}
        </table>
      </div>

      <div className="pointer-events-none absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity duration-200 group-hover/table:pointer-events-auto group-hover/table:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
        <button
          type="button"
          onClick={handleCopyMarkdown}
          aria-label={copied ? '已复制表格' : '复制表格'}
          title={copied ? '已复制' : '复制表格'}
          className="rounded-md p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
        >
          {copied ? (
            <Check size={14} className="text-[var(--theme-text-success)]" />
          ) : (
            <Copy size={14} />
          )}
        </button>
        <button
          type="button"
          onClick={handleDownloadCsv}
          aria-label="下载表格"
          title="下载表格"
          className="rounded-md p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

const Anchor = ({ href, children, ...props }: AnchorProps) => {
  const isInternal = href && (href.startsWith('#') || href.startsWith('/'));

  return (
    <a
      href={href}
      target={isInternal ? undefined : '_blank'}
      rel={isInternal ? undefined : 'noopener noreferrer'}
      {...props}
    >
      {children}
    </a>
  );
};

type MarkdownRendererProps = {
  content: string;
  className?: string;
  isStreaming?: boolean;
};

const MarkdownRenderer = ({ content, className, isStreaming = false }: MarkdownRendererProps) => {
  const rootClassName = ['markdown-body', isStreaming ? 'is-loading' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        urlTransform={transformMarkdownUrl}
        components={{
          code: CodeBlock,
          pre: PreBlock,
          table: TableBlock,
          a: Anchor,
        }}
      >
        {preprocessMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
