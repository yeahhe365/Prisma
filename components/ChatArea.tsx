import React from 'react';
import { ChatMessage, AppState, AnalysisResult, ExpertResult } from '../types';
import ChatMessageView from './ChatMessage';
import ProcessFlow from './ProcessFlow';
import Logo from './Logo';
import { Code, BookOpen, Lightbulb, BarChart3 } from 'lucide-react';

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
  processStartTime,
  processEndTime,
  onSuggestionClick,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  onContinueGeneration,
  onForkMessage,
}: ChatAreaProps) => {
  const isIdle = messages.length === 0 && appState === 'idle';

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      {isIdle ? (
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4 text-center">
          <div className="relative z-10 flex flex-col items-center animate-fade-in">
            <Logo className="mb-6 h-20 w-20 text-[var(--theme-text-primary)] opacity-90" />
            <p className="text-2xl font-semibold tracking-normal text-[var(--theme-text-primary)]">
              Prisma
            </p>
            <p className="mx-auto mb-8 mt-2 max-w-xs text-sm text-[var(--theme-text-tertiary)]">
              多智能体深度推理，专家协同协作。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick?.(s.text)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--theme-border-focus)] hover:bg-[var(--theme-bg-tertiary)] hover:shadow-md active:translate-y-0 ${s.color}`}
                >
                  <s.icon size={16} className="shrink-0 text-[var(--theme-text-tertiary)]" />
                  <span className="font-medium leading-snug text-[var(--theme-text-primary)]">
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

          {/* Active Generation (Ghost Message) */}
          {appState !== 'idle' && appState !== 'completed' && (
            <div className="group w-full bg-transparent text-[var(--theme-text-primary)]">
              <div className="max-w-3xl mx-auto px-4 py-8 flex gap-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] shadow-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-border-focus)] border-t-transparent"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-2 text-sm font-semibold text-[var(--theme-text-primary)]">
                    Prisma
                  </div>

                  {/* Loading Skeleton */}
                  {!finalOutput && (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 w-3/4 rounded bg-[var(--theme-bg-tertiary)]"></div>
                      <div className="h-4 w-full rounded bg-[var(--theme-bg-tertiary)]"></div>
                      <div className="h-4 w-5/6 rounded bg-[var(--theme-bg-tertiary)]"></div>
                      <div className="h-4 w-2/3 rounded bg-[var(--theme-bg-tertiary)]"></div>
                    </div>
                  )}

                  {/* Active Thinking Process */}
                  <div className="mb-4 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-5 shadow-sm">
                    <ProcessFlow
                      appState={appState}
                      managerAnalysis={managerAnalysis}
                      experts={experts}
                      processStartTime={processStartTime}
                      processEndTime={processEndTime}
                    />
                  </div>

                  {/* Streaming Output */}
                  {finalOutput && (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ChatMessageView
                        message={{
                          id: 'streaming',
                          role: 'model',
                          content: finalOutput,
                          isThinking: false,
                        }}
                        prevMessage={messages[messages.length - 1]}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatArea;
