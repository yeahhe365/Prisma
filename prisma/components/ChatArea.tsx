
import React from 'react';
import { ChatMessage, AppState, AnalysisResult, ExpertResult } from '../types';
import ChatMessageItem from './ChatMessage';
import ProcessFlow from './ProcessFlow';
import Logo from './Logo';

interface ChatAreaProps {
  messages: ChatMessage[];
  appState: AppState;
  managerAnalysis: AnalysisResult | null;
  experts: ExpertResult[];
  finalOutput: string;
  processStartTime: number | null;
  processEndTime: number | null;
}

const ChatArea = ({
  messages,
  appState,
  managerAnalysis,
  experts,
  finalOutput,
  processStartTime,
  processEndTime
}: ChatAreaProps) => {
  const isIdle = messages.length === 0 && appState === 'idle';

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      {isIdle ? (
        <div className="h-full flex flex-col items-center justify-center opacity-100 px-4 text-center animate-in fade-in duration-700">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-indigo-400 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000 rounded-full animate-pulse-slow"></div>
            <Logo className="relative w-24 h-24 drop-shadow-2xl transition-transform duration-700 hover:scale-105" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4 font-display">
            Prisma
            <span className="text-indigo-500">.ai</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-md leading-relaxed font-medium">
            Deep multi-agent reasoning engine. <br/>
            <span className="text-slate-400 font-normal text-base">Visualize the thought process in real-time.</span>
          </p>
        </div>
      ) : (
        <div className="pb-48">
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
            <div className="group w-full bg-transparent text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8 flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center backdrop-blur-sm ring-1 ring-indigo-50">
                  <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    Prisma
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 animate-pulse">Thinking</span>
                  </div>
                  
                  {/* Active Thinking Process */}
                  <div className="mb-6 bg-white/70 border border-indigo-100/60 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl ring-1 ring-white/60">
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
                    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-indigo-600">
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
