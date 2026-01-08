
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
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      <div className="pb-40">
        {messages.length === 0 && appState === 'idle' && (
           <div className="h-full flex flex-col items-center justify-center pt-32 opacity-70 px-4 text-center">
              <Logo className="w-24 h-24 mb-6 drop-shadow-xl animate-pulse-slow" />
              <p className="text-xl font-bold text-slate-900">Prisma</p>
              <p className="text-sm text-slate-500 max-w-xs mt-2">
                Deep multi-agent reasoning.
              </p>
           </div>
        )}

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
           <div className="group w-full bg-transparent text-slate-800">
              <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-blue-200 shadow-sm flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 mb-2">Prisma</div>
                    
                    {/* Active Thinking Process */}
                    <div className="mb-4 bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
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
                      <div className="prose prose-slate max-w-none">
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
    </div>
  );
};

export default ChatArea;
