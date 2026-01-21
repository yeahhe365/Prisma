import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Loader2, CheckCircle2, X, BrainCircuit, MessageSquareText, Thermometer, Timer, Repeat, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import MarkdownRenderer from './components/MarkdownRenderer';
import { ExpertResult } from './types';

// Simple component to format milliseconds to ss.ms or mm:ss
const TimeDisplay = ({ start, end, status }: { start?: number, end?: number, status: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    
    // Update live timer
    if (status === 'thinking' && start) {
      setElapsed(Date.now() - start);
      interval = setInterval(() => {
        setElapsed(Date.now() - start);
      }, 100);
    } 
    // Show final duration
    else if ((status === 'completed' || status === 'error') && start && end) {
      setElapsed(end - start);
    } 
    else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [status, start, end]);

  if (!start) return null;

  const seconds = (elapsed / 1000).toFixed(1);
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
      <Timer size={10} />
      <span>{seconds}s</span>
    </div>
  );
};

// Helper to extract the last meaningful line of thought
const getLastThought = (text?: string) => {
  if (!text) return "";
  // Clean up markdown markers broadly
  const cleanText = text.replace(/[*_#`]/g, ''); 
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.length ? lines[lines.length - 1] : "";
};

const ExpertCard = ({ expert }: { expert: ExpertResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [view, setView] = useState<'thoughts' | 'output'>('output');
  
  const isWorking = expert.status === 'thinking';
  const isDone = expert.status === 'completed';
  const isPending = expert.status === 'pending';
  const isError = expert.status === 'error';
  const round = expert.round || 1;

  // Auto-switch to thoughts if that's all we have so far
  useEffect(() => {
    if (isWorking && expert.thoughts && !expert.content) {
      setView('thoughts');
    } else if (expert.content && view === 'thoughts' && !expert.thoughts) {
      setView('output');
    }
  }, [expert.thoughts, expert.content, isWorking]);

  // Determine border/bg styles based on status
  const getStatusStyles = () => {
    if (isWorking) return 'border-indigo-300 bg-white shadow-md shadow-indigo-100 ring-1 ring-indigo-50';
    if (isDone) return 'border-teal-200 bg-white hover:border-teal-300 hover:shadow-md';
    if (isError) return 'border-red-200 bg-red-50/30';
    return 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100';
  };

  const currentThought = getLastThought(expert.thoughts);

  const ExpandedModal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />
      
      {/* Modal Content */}
      <div className={`
        relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white
        animate-in zoom-in-95 duration-200
        ${isWorking ? 'ring-2 ring-indigo-400' : ''}
      `}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-50/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl shadow-sm ring-1 ring-inset ${isWorking ? 'bg-indigo-50 text-indigo-600 ring-indigo-100' : (isDone ? 'bg-teal-50 text-teal-600 ring-teal-100' : 'bg-slate-100 text-slate-400 ring-slate-200')}`}>
                <Bot size={20} />
             </div>
             <div>
               <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                 {expert.role}
                 {round > 1 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200 text-slate-500 font-mono">R{round}</span>}
               </h2>
               <div className="flex items-center gap-2 text-xs text-slate-500">
                 <TimeDisplay start={expert.startTime} end={expert.endTime} status={expert.status} />
                 <span>•</span>
                 <span className="uppercase tracking-wider font-semibold text-[10px]">
                   {isWorking ? 'Thinking...' : expert.status}
                 </span>
               </div>
             </div>
          </div>
          
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white sticky top-0 z-10">
          <button 
            onClick={() => setView('thoughts')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${view === 'thoughts' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <BrainCircuit size={14} />
            Reasoning
            {expert.thoughts && <span className="bg-slate-100 px-1.5 rounded-full text-[9px] text-slate-500">{expert.thoughts.length > 0 ? '•' : ''}</span>}
          </button>
          <button 
            onClick={() => setView('output')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${view === 'output' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <MessageSquareText size={14} />
            Output
            {expert.content && <span className="bg-slate-100 px-1.5 rounded-full text-[9px] text-slate-500">{expert.content.length > 0 ? '•' : ''}</span>}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
            {view === 'thoughts' && (
              <div className="prose prose-sm max-w-none">
                {expert.thoughts ? (
                  <MarkdownRenderer 
                    content={expert.thoughts} 
                    className="text-slate-600 font-mono text-xs leading-relaxed" 
                  />
                ) : (
                  <div className="text-center py-12 text-slate-400 italic">No reasoning thoughts recorded.</div>
                )}
                {isWorking && expert.thoughts && <div className="h-4 w-1 bg-indigo-500 animate-pulse inline-block ml-1"/>}
              </div>
            )}
            
            {view === 'output' && (
              <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600">
                {expert.content ? (
                   <MarkdownRenderer 
                    content={expert.content} 
                    className="text-sm" 
                   />
                ) : (
                  <div className="text-center py-12 text-slate-400 italic">No output generated yet.</div>
                )}
                 {isWorking && !expert.content && <div className="h-4 w-1 bg-indigo-500 animate-pulse inline-block ml-1"/>}
              </div>
            )}
        </div>
        
        {/* Footer */}
        {expert.description && (
          <div className="p-3 border-t bg-slate-50 text-[10px] text-slate-500 truncate px-6">
            <span className="font-semibold text-slate-700">Goal:</span> {expert.description}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Collapsed Widget View */}
      <div 
        onClick={() => !isPending && setIsExpanded(true)}
        className={`
          group relative flex flex-col p-3 rounded-xl border transition-all duration-300 cursor-pointer
          ${getStatusStyles()}
          ${!isPending ? 'active:scale-[0.98]' : 'cursor-default'}
        `}
      >
        {/* Top Row: Icon, Role, Timer */}
        <div className="flex items-center gap-3 mb-2">
           <div className={`
             flex items-center justify-center w-8 h-8 rounded-lg shadow-sm border transition-colors
             ${isWorking ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : ''}
             ${isDone ? 'bg-teal-50 border-teal-100 text-teal-600' : ''}
             ${isError ? 'bg-red-50 border-red-100 text-red-600' : ''}
             ${isPending ? 'bg-slate-100 border-slate-200 text-slate-400' : ''}
           `}>
             {isWorking ? <Loader2 size={16} className="animate-spin" /> : 
              (isDone ? <CheckCircle2 size={16} /> : 
               (isError ? <X size={16} /> : <Bot size={16} />))
             }
           </div>
           
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-1.5">
               <h3 className={`text-xs font-bold truncate ${isPending ? 'text-slate-400' : 'text-slate-700'}`}>
                 {expert.role}
               </h3>
               {round > 1 && <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-500 border border-slate-200 font-mono">R{round}</span>}
             </div>
             
             {/* Subtext: Status or Description */}
             <div className="text-[10px] text-slate-400 truncate">
               {isPending ? 'Waiting for assignment...' : expert.description}
             </div>
           </div>

           <TimeDisplay start={expert.startTime} end={expert.endTime} status={expert.status} />
        </div>

        {/* Bottom Row: Rolling Thought / Activity Indicator */}
        {!isPending && (
          <div className={`
            relative mt-1 px-2.5 py-1.5 rounded-md border text-[10px] font-mono truncate transition-colors
            ${isWorking ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500'}
          `}>
             {/* Rolling animation container */}
             <div className="flex items-center gap-2 overflow-hidden">
                {isWorking && <Loader2 size={10} className="animate-spin shrink-0 text-indigo-400" />}
                <span className={`truncate w-full ${isWorking ? 'animate-pulse' : ''}`}>
                  {isWorking && !currentThought ? "Initializing..." : (currentThought || "View details...")}
                </span>
             </div>
             
             {/* Hover hint */}
             <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-0.5 rounded shadow-sm text-indigo-600">
               <Maximize2 size={10} />
             </div>
          </div>
        )}
      </div>

      {/* Render Portal for Expanded View */}
      {isExpanded && createPortal(ExpandedModal, document.body)}
    </>
  );
};

export default ExpertCard;
