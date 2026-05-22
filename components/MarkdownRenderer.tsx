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
        className={`${className} bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm font-mono border border-slate-200`}
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
    <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-200 bg-[#1e1e1e] shadow-sm">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#333] text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal size={14} />
          <span className="font-mono text-slate-300">{language || 'text'}</span>
          <span className="text-[10px] text-slate-500">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-2">
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{expanded ? 'Collapse' : 'Expand'}</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
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
          <div className="sticky top-0 z-10 h-6 bg-gradient-to-b from-[#1e1e1e] to-transparent pointer-events-none" />
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
