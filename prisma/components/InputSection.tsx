import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { AppState } from '../types';

interface InputSectionProps {
  query: string;
  setQuery: (q: string) => void;
  onRun: () => void;
  onStop: () => void;
  appState: AppState;
}

const InputSection = ({ query, setQuery, onRun, onStop, appState }: InputSectionProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const adjustHeight = () => {
    if (textareaRef.current) {
      // Reset height to auto to allow shrinking when text is deleted
      textareaRef.current.style.height = 'auto';
      
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;

      // Set new height based on scrollHeight, capped at 200px
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      
      // Only show scrollbar if we hit the max height limit
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  // Focus input on mount and when app becomes idle (e.g. after "New Chat" or completion)
  useEffect(() => {
    if (appState === 'idle' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [appState]);

  // useLayoutEffect prevents visual flickering by adjusting height before paint
  useLayoutEffect(() => {
    adjustHeight();
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If user presses Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      // robust check for IME composition (e.g. Chinese/Japanese inputs)
      if (isComposing || (e.nativeEvent as any).isComposing) {
        return;
      }
      
      e.preventDefault();
      if (query.trim() && appState === 'idle') {
        onRun();
      }
    }
  };

  const isRunning = appState !== 'idle';

  return (
    <div className="w-full">
      {/* Container: Flex items-end ensures button stays at bottom right as text grows */}
      <div className="w-full flex items-end p-2 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[26px] shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white/90 transition-colors duration-200">
        
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Ask a complex question..."
          rows={1}
          autoFocus
          className="flex-1 max-h-[200px] py-3 pl-4 pr-2 bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-800 placeholder:text-slate-400 leading-relaxed custom-scrollbar text-base"
          style={{ minHeight: '48px' }}
        />

        <div className="flex-shrink-0 pb-0.5 pr-0.5">
          {isRunning ? (
            <button
              onClick={onStop}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-colors shadow-md"
            >
              <Square size={14} className="fill-current" />
            </button>
          ) : (
            <button
              onClick={() => {
                 if (query.trim()) onRun();
              }}
              disabled={!query.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputSection;