import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal } from 'lucide-react';

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  // Inline code (e.g. `const x = 1`)
  if (inline) {
    return (
      <code className={`${className} bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm font-mono border border-slate-200`} {...props}>
        {children}
      </code>
    );
  }

  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-200 bg-[#1e1e1e] shadow-sm">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#333] text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal size={14} />
          <span className="font-mono text-slate-300">{language || 'text'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      
      {/* Syntax Highlighter */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem', // text-sm
            lineHeight: '1.5',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          codeTagProps={{
            style: { fontFamily: 'JetBrains Mono, monospace' }
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

const MarkdownRenderer = ({ content, className }: { content: string, className?: string }) => {
  /**
   * Pre-process content to handle common LaTeX delimiters from Gemini
   * and optimize Markdown compatibility.
   */
  const preprocessMarkdown = (text: string) => {
    if (!text) return "";
    
    return text
      // Replace \[ ... \] with $$ ... $$
      .replace(/\\\[/g, '$$$$')
      .replace(/\\\]/g, '$$$$')
      // Replace \( ... \) with $ ... $
      .replace(/\\\(/g, '$$')
      .replace(/\\\)/g, '$$')
      // Fix potential spacing issues between bold marks and math delimiters
      .replace(/\*\*(\$)/g, '** $1')
      .replace(/(\$)\*\*/g, '$1 **');
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          code: CodeBlock
        }}
      >
        {preprocessMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;