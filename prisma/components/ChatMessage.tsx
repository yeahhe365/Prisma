
import React, { useState } from 'react';
import { User, Sparkles, ChevronDown, ChevronRight, Copy, Check, BrainCircuit } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import ProcessFlow from './ProcessFlow';
import { ChatMessage } from '../types';

interface ChatMessageProps {
  message: ChatMessage;
  isLast?: boolean;
}

const ChatMessageItem = ({ message, isLast }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if there is any thinking data to show
  const hasThinkingData = message.analysis || (message.experts && message.experts.length > 0);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group w-full text-slate-800 border-b border-transparent ${
      isUser 
        ? 'bg-transparent' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10 flex gap-6 md:gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-inset transition-transform hover:scale-105 duration-300 ${
            isUser 
              ? 'bg-slate-100 ring-slate-200 text-slate-600' 
              : 'bg-indigo-600 ring-indigo-600 text-white shadow-indigo-200 shadow-lg'
          }`}>
            {isUser ? (
              <User size={20} strokeWidth={2} />
            ) : (
              <Sparkles size={20} strokeWidth={2} className="fill-indigo-500 text-white" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              {isUser ? 'You' : 'Prisma'}
              {!isUser && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider border border-indigo-100">
                  AI
                </span>
              )}
            </div>
            {message.content && (
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 border scale-95
                  ${copied 
                    ? 'text-indigo-600 bg-indigo-50 border-indigo-100' 
                    : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-white hover:border-slate-200 hover:shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100'
                  }`}
                title="Copy message"
              >
                {copied ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Copied</span>
                  </>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            )}
          </div>

          {/* Thinking Process Accordion (Only for AI) */}
          {!isUser && hasThinkingData && (
            <div className="mb-8">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="group/btn flex items-center gap-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 transition-all w-full md:w-auto shadow-sm hover:shadow-md active:scale-[0.99]"
              >
                <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover/btn:bg-indigo-100 ${message.isThinking ? 'animate-pulse' : ''}`}>
                  <BrainCircuit size={12} strokeWidth={2.5} />
                </div>
                <span>
                   {message.isThinking 
                      ? "Reasoning in progress..." 
                      : (message.totalDuration 
                          ? `Reasoning process (${(message.totalDuration / 1000).toFixed(1)}s)` 
                          : "View reasoning process")
                   }
                </span>
                <span className="ml-1 text-slate-300">|</span>
                {showThinking ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </button>

              {showThinking && (
                <div className="mt-4 p-5 bg-white/60 border border-slate-200/60 rounded-2xl shadow-inner animate-in fade-in slide-in-from-top-2">
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
            <div className="flex flex-wrap gap-3 mb-4">
              {message.attachments.map(att => (
                 <img 
                   key={att.id} 
                   src={att.url || `data:${att.mimeType};base64,${att.data}`}
                   alt="attachment" 
                   className="h-40 w-40 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all duration-300"
                   onClick={() => window.open(att.url || `data:${att.mimeType};base64,${att.data}`, '_blank')}
                 />
              ))}
            </div>
          )}

          {/* Text Content */}
          <div className="prose prose-slate max-w-none prose-p:leading-7 prose-headings:font-bold prose-headings:text-slate-900 prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none font-medium">
            {message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              message.isThinking && <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse rounded-sm" />
            )}
          </div>
          
          {/* Internal Monologue (Synthesis Thoughts) - Optional Footer */}
          {!isUser && message.synthesisThoughts && (
             <div className="mt-6 pt-6 border-t border-slate-100">
               <details className="group/thoughts">
                 <summary className="cursor-pointer list-none text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 select-none transition-colors">
                   <ChevronRight size={12} className="group-open/thoughts:rotate-90 transition-transform duration-200" />
                   Show Internal Monologue
                 </summary>
                 <div className="mt-3 text-xs font-mono text-slate-500 bg-slate-50/80 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar shadow-inner">
                   {message.synthesisThoughts}
                 </div>
               </details>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;
