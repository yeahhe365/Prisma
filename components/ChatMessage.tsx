import React, { useEffect, useRef, useState } from 'react';
import {
  User,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Edit3,
  Trash2,
  RotateCw,
  MoreHorizontal,
  CirclePlay,
  GitBranch,
  Pencil,
} from 'lucide-react';
import LazyMarkdownRenderer from '@/components/LazyMarkdownRenderer';
import ProcessFlow from '@/components/ProcessFlow';
import AttachmentRenderer from '@/components/AttachmentRenderer';
import Logo from '@/components/Logo';
import type { ChatMessage as ChatMessageType } from '@/types';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface ChatMessageProps {
  message: ChatMessageType;
  prevMessage?: ChatMessageType;
  onEditMessage?: (messageId: string, mode: 'update' | 'resend') => void;
  onDeleteMessage?: (messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onContinueGeneration?: (messageId: string) => void;
  onForkMessage?: (messageId: string) => void;
}

const actionButtonClasses =
  'p-1.5 rounded-lg text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] opacity-80 hover:opacity-100';
const menuItemClasses =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-xs whitespace-nowrap text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus-visible:bg-[var(--theme-bg-tertiary)] focus-visible:text-[var(--theme-text-primary)]';
const actionIconSize = 16;

interface MessageActionsProps {
  message: ChatMessageType;
  isGrouped: boolean;
  copied: boolean;
  onCopy: () => void;
  onEditMessage?: (messageId: string, mode: 'update' | 'resend') => void;
  onDeleteMessage?: (messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onContinueGeneration?: (messageId: string) => void;
  onForkMessage?: (messageId: string) => void;
}

const AvatarButton = ({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => {
  if (!onClick) {
    return <div className="relative flex h-7 items-center justify-center sm:h-8">{children}</div>;
  }

  return (
    <button
      type="button"
      className="group/avatar relative cursor-pointer rounded-full border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-primary)]"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
      <div className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/60 backdrop-blur-[1px] transition-all duration-200 animate-in fade-in group-hover/avatar:flex dark:bg-black/50">
        <Pencil size={12} className="text-white" strokeWidth={2.5} />
      </div>
    </button>
  );
};

const MessageAvatar = ({
  message,
  isGrouped,
  onEditMessage,
}: {
  message: ChatMessageType;
  isGrouped: boolean;
  onEditMessage?: (messageId: string, mode: 'update' | 'resend') => void;
}) => {
  if (isGrouped) {
    return <div className="h-7 sm:h-8" />;
  }

  const label = '编辑消息';
  const editHandler = onEditMessage ? () => onEditMessage(message.id, 'update') : undefined;

  return (
    <AvatarButton label={label} onClick={editHandler}>
      {message.role === 'user' ? (
        <User
          size={29}
          className="flex-shrink-0 text-[var(--theme-icon-user)]"
          strokeWidth={2}
          aria-hidden="true"
        />
      ) : (
        <Logo
          aria-label="Prisma"
          className="h-[29px] w-[29px] flex-shrink-0 text-[var(--theme-icon-model)]"
        />
      )}
    </AvatarButton>
  );
};

const MessageActions = ({
  message,
  isGrouped,
  copied,
  onCopy,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  onContinueGeneration,
  onForkMessage,
}: MessageActionsProps) => {
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement | null>(null);
  const showRetryButton = message.role === 'model' && !!onRetryMessage;
  const showOverflowActions =
    message.role === 'model' && (!!onContinueGeneration || !!onForkMessage) && !message.isThinking;

  useEffect(() => {
    if (!isOverflowOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!overflowRef.current?.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOverflowOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOverflowOpen]);

  return (
    <div
      data-testid="message-actions-column"
      className="sticky top-2 z-10 flex h-full w-8 flex-shrink-0 flex-col items-center self-start sm:top-4 sm:w-10"
    >
      <div className="flex h-7 items-center justify-center sm:h-8">
        <MessageAvatar message={message} isGrouped={isGrouped} onEditMessage={onEditMessage} />
      </div>

      <div
        data-testid="message-actions"
        className="message-actions mt-1 flex translate-y-1 flex-col items-center gap-1 opacity-0 transition-all duration-300 ease-in-out pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto max-sm:translate-y-0 max-sm:opacity-100 max-sm:pointer-events-auto"
      >
        {message.role === 'user' && onEditMessage && (
          <button
            type="button"
            onClick={() => onEditMessage(message.id, 'resend')}
            title="编辑消息"
            aria-label="编辑消息"
            className={actionButtonClasses}
          >
            <Edit3 size={actionIconSize} strokeWidth={2} />
          </button>
        )}

        {showRetryButton && (
          <button
            type="button"
            onClick={() => onRetryMessage?.(message.id)}
            title="重新生成"
            aria-label="重新生成"
            className={actionButtonClasses}
          >
            <RotateCw size={actionIconSize} strokeWidth={2} />
          </button>
        )}

        {showOverflowActions && (
          <div ref={overflowRef} className="relative">
            <button
              type="button"
              onClick={() => setIsOverflowOpen((value) => !value)}
              title="更多操作"
              aria-label="更多操作"
              aria-haspopup="menu"
              aria-expanded={isOverflowOpen}
              className={actionButtonClasses}
            >
              <MoreHorizontal size={actionIconSize} strokeWidth={2} />
            </button>

            {isOverflowOpen && (
              <div
                role="menu"
                className="absolute left-full top-0 z-40 ml-1 min-w-40 overflow-hidden rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-secondary)] py-1 shadow-lg"
              >
                {onContinueGeneration && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOverflowOpen(false);
                      onContinueGeneration(message.id);
                    }}
                    title="继续生成"
                    aria-label="继续生成"
                    className={menuItemClasses}
                  >
                    <CirclePlay size={14} strokeWidth={2} />
                    <span>继续生成</span>
                  </button>
                )}

                {onForkMessage && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOverflowOpen(false);
                      onForkMessage(message.id);
                    }}
                    title="从此分支"
                    aria-label="从此分支"
                    className={menuItemClasses}
                  >
                    <GitBranch size={14} strokeWidth={2} />
                    <span>从此分支</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {message.content && !message.isThinking && (
          <button
            type="button"
            onClick={onCopy}
            className={`${actionButtonClasses} ${copied ? 'bg-[var(--theme-bg-success)] text-[var(--theme-text-success)] opacity-100' : ''}`}
            title="复制消息"
            aria-label={copied ? '已复制' : '复制消息'}
          >
            {copied ? (
              <Check size={actionIconSize} strokeWidth={2} />
            ) : (
              <Copy size={actionIconSize} strokeWidth={2} />
            )}
          </button>
        )}

        {onDeleteMessage && !message.isThinking && (
          <button
            type="button"
            onClick={() => onDeleteMessage(message.id)}
            title="删除消息"
            aria-label="删除消息"
            className={`${actionButtonClasses} hover:bg-[var(--theme-bg-danger)]/10 hover:text-[var(--theme-text-danger)]`}
          >
            <Trash2 size={actionIconSize} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
};

const ChatMessage = ({
  message,
  prevMessage,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  onContinueGeneration,
  onForkMessage,
}: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  // Check if there is any thinking data to show
  const hasThinkingData = message.analysis || (message.experts && message.experts.length > 0);

  const handleCopy = () => {
    if (!message.content) return;
    copy(message.content);
  };

  const isGrouped = !!(prevMessage && prevMessage.role === message.role && !message.isThinking);
  const isModelThinkingOrHasThoughts = !isUser && (message.isThinking || hasThinkingData);
  const messageContainerClasses = `flex items-start gap-2 sm:gap-4 group ${isGrouped ? 'mt-1.5' : 'mt-6'} ${isUser ? 'justify-end' : 'justify-start'}`;
  const widthConstraints = isUser
    ? 'max-w-[80%] sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl'
    : 'max-w-[calc(100%-2.5rem)] sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl';
  const bubbleClasses = isUser
    ? `message-content-container flex min-w-0 flex-col transition-all duration-200 ${widthConstraints} w-fit rounded-2xl rounded-tr-sm border border-transparent bg-[var(--theme-bg-user-message)] px-4 py-3 text-[var(--theme-bg-user-message-text)] shadow-sm sm:px-5 sm:py-4`
    : `message-content-container flex min-w-0 flex-col transition-all duration-200 ${widthConstraints} w-full py-0 text-[var(--theme-text-primary)] ${isModelThinkingOrHasThoughts ? 'sm:min-w-[320px]' : ''}`;
  const messageActions = (
    <MessageActions
      message={message}
      isGrouped={isGrouped}
      copied={copied}
      onCopy={handleCopy}
      onEditMessage={onEditMessage}
      onDeleteMessage={onDeleteMessage}
      onRetryMessage={onRetryMessage}
      onContinueGeneration={onContinueGeneration}
      onForkMessage={onForkMessage}
    />
  );

  return (
    <div className="relative" data-message-id={message.id} data-message-role={message.role}>
      <div className="mx-auto w-full max-w-7xl px-1.5 sm:px-2 md:px-3">
        <div className={messageContainerClasses} data-testid="message-row">
          {!isUser && messageActions}

          {/* User message bubble */}
          {isUser ? (
            <div className={bubbleClasses} data-testid="message-bubble">
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <AttachmentRenderer attachments={message.attachments} variant="user" />
              )}
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </div>
            </div>
          ) : (
            <div className={bubbleClasses} data-testid="message-bubble">
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
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
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
              <div className="max-w-none">
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
            </div>
          )}

          {isUser && messageActions}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
