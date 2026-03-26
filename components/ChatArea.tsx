
import React from 'react';
import { ChatMessage, AppState, AnalysisResult, ExpertResult } from '../types';
import ChatMessageItem from './ChatMessage';
import ProcessFlow from './ProcessFlow';
import Logo from './Logo';
import { Code, BookOpen, Lightbulb, BarChart3 } from 'lucide-react';

const SUGGESTIONS = [
  { icon: Lightbulb, text: '用简单的方式解释量子计算', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { icon: Code, text: '编写一个排序算法并分析时间复杂度', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { icon: BookOpen, text: '总结系统思维的核心思想', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { icon: BarChart3, text: '比较不同的机器学习方法', color: 'text-purple-600 bg-purple-50 border-purple-200' },
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
}

const ChatArea = ({
  messages,
  appState,
  managerAnalysis,
  experts,
  finalOutput,
  processStartTime,
  processEndTime,
  onSuggestionClick
}: ChatAreaProps) => {
  const isIdle = messages.length === 0 && appState === 'idle';

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      {isIdle ? (
        <div className="h-full flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-blue-100/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-100/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-50/20 dark:bg-emerald-900/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col items-center animate-fade-in">
            <Logo className="w-24 h-24 mb-6 drop-shadow-xl animate-pulse-slow" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Prisma</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 mb-8">
              多智能体深度推理，专家协同协作。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick?.(s.text)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${s.color}`}
                >
                  <s.icon size={16} className="shrink-0 opacity-70" />
                  <span className="text-slate-700 font-medium leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-28">
          {/* History */}
          {messages.map((msg, idx) => (
            <ChatMessageItem 
              key={msg.id} 
              message={msg} 
              isLast={idx === messages.length - 1} 
            />
          ))}

          {/* Active Generation (Ghost Message) */}
          {appState !== 'idle' && appState !== 'completed' && (
            <div className="group w-full bg-transparent text-slate-800 dark:text-slate-200">
              <div className="max-w-3xl mx-auto px-4 py-8 flex gap-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 shadow-sm flex items-center justify-center">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">Prisma</div>

                  {/* Loading Skeleton */}
                  {!finalOutput && (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                    </div>
                  )}

                  {/* Active Thinking Process */}
                  <div className="mb-4 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-5 shadow-sm">
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
                      <ChatMessageItem 
                        message={{
                          id: 'streaming', 
                          role: 'model', 
                          content: finalOutput, 
                          isThinking: false
                        }} 
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
