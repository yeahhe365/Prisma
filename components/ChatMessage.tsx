import React, { useState } from 'react';
import { User, Sparkles, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import LazyMarkdownRenderer from './LazyMarkdownRenderer';
import ProcessFlow from './ProcessFlow';
import AttachmentRenderer from './AttachmentRenderer';
import type { ChatMessage as ChatMessageType } from '../types';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  // Check if there is any thinking data to show
  const hasThinkingData = message.analysis || (message.experts && message.experts.length > 0);

  const handleCopy = () => {
    if (!message.content) return;
    copy(message.content);
  };

  return (
    <div
      className={`group w-full text-[var(--theme-text-primary)] ${isUser ? 'bg-[var(--theme-bg-secondary)]/60' : 'bg-transparent'}`}
    >
      <div className="max-w-3xl mx-auto px-4 py-6 flex gap-4 md:gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isUser
                ? 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-user-message)]'
                : 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] shadow-sm'
            }`}
          >
            {isUser ? (
              <User size={16} className="text-[var(--theme-icon-user)]" />
            ) : (
              <Sparkles size={16} className="text-[var(--theme-icon-model)]" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold text-[var(--theme-text-primary)]">
              {isUser ? '你' : 'Prisma'}
            </div>
            {!isUser && message.content && (
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5
                  ${
                    copied
                      ? 'bg-[var(--theme-bg-success)] text-[var(--theme-text-success)]'
                      : 'text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100'
                  }`}
                title="复制消息"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span className="text-[10px] font-medium uppercase tracking-wider">已复制</span>
                  </>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
          </div>

          {/* User message bubble */}
          {isUser ? (
            <div className="rounded-2xl rounded-tr-sm border border-transparent bg-[var(--theme-bg-user-message)] px-4 py-3 text-[var(--theme-bg-user-message-text)]">
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <AttachmentRenderer attachments={message.attachments} variant="user" />
              )}
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </div>
              {message.content && (
                <div className="flex justify-end mt-1">
                  <button
                    onClick={handleCopy}
                    className={`p-1 rounded transition-all flex items-center gap-1 text-[10px]
                      ${copied ? 'text-[var(--theme-text-success)]' : 'text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]'}`}
                  >
                    {copied ? (
                      <>
                        <Check size={12} /> 已复制
                      </>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Thinking Process Accordion (Only for AI) */}
              {hasThinkingData && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="flex w-full items-center gap-2 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-3 py-2 text-xs font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] md:w-auto"
                  >
                    <span>
                      {message.isThinking
                        ? '思考中...'
                        : message.totalDuration
                          ? `思考了 ${(message.totalDuration / 1000).toFixed(1)} 秒`
                          : '推理过程'}
                    </span>
                    {showThinking ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {showThinking && (
                    <div className="mt-3 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <ProcessFlow
                        appState={message.isThinking ? 'experts_working' : 'completed'}
                        managerAnalysis={message.analysis || null}
                        experts={message.experts || []}
                        defaultExpanded={true}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <AttachmentRenderer attachments={message.attachments} variant="ai" />
              )}

              {/* Text Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-7 prose-pre:bg-[var(--theme-bg-code-block)] prose-pre:text-[var(--theme-text-primary)]">
                {message.content ? (
                  message.isThinking ? (
                    <pre className="whitespace-pre-wrap break-words text-sm text-[var(--theme-text-secondary)]">
                      {message.content}
                    </pre>
                  ) : (
                    <LazyMarkdownRenderer content={message.content} />
                  )
                ) : (
                  message.isThinking && (
                    <span className="inline-block h-4 w-2 animate-pulse bg-[var(--theme-border-focus)]" />
                  )
                )}
              </div>

              {/* Internal Monologue (Synthesis Thoughts) - Optional Footer */}
              {message.synthesisThoughts && (
                <div className="mt-4 border-t border-[var(--theme-border-primary)] pt-4">
                  <details className="group/thoughts">
                    <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]">
                      <ChevronRight
                        size={12}
                        className="group-open/thoughts:rotate-90 transition-transform"
                      />
                      显示内部独白
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] p-3 font-mono text-xs text-[var(--theme-text-secondary)]">
                      {message.synthesisThoughts}
                    </div>
                  </details>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
