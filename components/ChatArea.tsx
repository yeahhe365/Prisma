import React from 'react';
import type { ChatMessage, AppState, AnalysisResult, ExpertResult } from '@/types';
import ChatMessageView from '@/components/ChatMessage';
import { Code, BookOpen, Lightbulb, BarChart3 } from 'lucide-react';

const ACTIVE_MESSAGE_ID = 'streaming';

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    text: '用简单的方式解释量子计算',
    color:
      'text-[var(--theme-text-primary)] bg-[var(--theme-bg-input)] border-[var(--theme-border-secondary)]',
  },
  {
    icon: Code,
    text: '编写一个排序算法并分析时间复杂度',
    color:
      'text-[var(--theme-text-primary)] bg-[var(--theme-bg-input)] border-[var(--theme-border-secondary)]',
  },
  {
    icon: BookOpen,
    text: '总结系统思维的核心思想',
    color:
      'text-[var(--theme-text-primary)] bg-[var(--theme-bg-input)] border-[var(--theme-border-secondary)]',
  },
  {
    icon: BarChart3,
    text: '比较不同的机器学习方法',
    color:
      'text-[var(--theme-text-primary)] bg-[var(--theme-bg-input)] border-[var(--theme-border-secondary)]',
  },
];

interface ChatAreaProps {
  messages: ChatMessage[];
  appState: AppState;
  managerAnalysis: AnalysisResult | null;
  experts: ExpertResult[];
  finalOutput: string;
  processStartTime: number | null;
  processEndTime: number | null;
  onSuggestionClick?: (text: string) => void;
  onEditMessage?: (messageId: string, mode: 'update' | 'resend') => void;
  onDeleteMessage?: (messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onContinueGeneration?: (messageId: string) => void;
  onForkMessage?: (messageId: string) => void;
}

const ChatArea = ({
  messages,
  appState,
  managerAnalysis,
  experts,
  finalOutput,
  onSuggestionClick,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  onContinueGeneration,
  onForkMessage,
}: ChatAreaProps) => {
  const isIdle = messages.length === 0 && appState === 'idle';

  return (
    <div className="chat-bg-enhancement relative flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      {isIdle ? (
        <div className="relative flex h-full flex-col overflow-hidden px-3 text-center">
          <div className="flex min-h-0 flex-1 items-center justify-center pb-32">
            <h1 className="text-3xl font-semibold tracking-normal text-[var(--theme-text-primary)] sm:text-4xl">
              有什么可以帮忙的？
            </h1>
          </div>
          <div className="pointer-events-none absolute bottom-[7.25rem] left-0 right-0 z-10 flex justify-center px-2 sm:px-3">
            <div className="pointer-events-auto flex w-full max-w-[40.32rem] gap-2 overflow-x-auto px-1 pb-1 no-scrollbar fade-mask-x">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick?.(s.text)}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-left text-sm shadow-sm transition-colors hover:border-[var(--theme-border-focus)] hover:bg-[var(--theme-bg-tertiary)] active:bg-[var(--theme-bg-tertiary)] ${s.color}`}
                >
                  <s.icon size={16} className="shrink-0 text-[var(--theme-text-tertiary)]" />
                  <span className="whitespace-nowrap font-medium text-[var(--theme-text-primary)]">
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-28">
          {/* History */}
          {messages.map((msg, index) => (
            <ChatMessageView
              key={msg.id}
              message={msg}
              prevMessage={messages[index - 1]}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onRetryMessage={onRetryMessage}
              onContinueGeneration={onContinueGeneration}
              onForkMessage={onForkMessage}
            />
          ))}

          {/* Active Generation */}
          {appState !== 'idle' && appState !== 'completed' && (
            <ChatMessageView
              message={{
                id: ACTIVE_MESSAGE_ID,
                role: 'model',
                content: finalOutput,
                isThinking: true,
                analysis: managerAnalysis,
                experts,
              }}
              prevMessage={messages[messages.length - 1]}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatArea;
