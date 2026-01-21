
import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { AppState, MessageAttachment } from '../types';
import { fileToBase64 } from '../utils';

interface InputSectionProps {
  query: string;
  setQuery: (q: string) => void;
  onRun: (attachments: MessageAttachment[]) => void;
  onStop: () => void;
  appState: AppState;
  focusTrigger?: number;
}

const InputSection = ({ query, setQuery, onRun, onStop, appState, focusTrigger }: InputSectionProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

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

  // Focus input on mount and when app becomes idle
  useEffect(() => {
    if (appState === 'idle' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [appState, focusTrigger]);

  // useLayoutEffect prevents visual flickering by adjusting height before paint
  useLayoutEffect(() => {
    adjustHeight();
  }, [query]);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    try {
      const base64 = await fileToBase64(file);
      const newAttachment: MessageAttachment = {
        id: Math.random().toString(36).substring(7),
        type: 'image',
        mimeType: file.type,
        data: base64,
        url: URL.createObjectURL(file)
      };
      setAttachments(prev => [...prev, newAttachment]);
    } catch (e) {
      console.error("Failed to process file", e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposing || (e.nativeEvent as any).isComposing) {
        return;
      }
      e.preventDefault();
      if ((query.trim() || attachments.length > 0) && appState === 'idle') {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!query.trim() && attachments.length === 0) return;
    onRun(attachments);
    setAttachments([]);
  };

  const isRunning = appState !== 'idle';

  return (
    <div className="w-full">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto px-1 py-1">
          {attachments.map(att => (
            <div key={att.id} className="relative group shrink-0">
              <img 
                src={att.url} 
                alt="attachment" 
                className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-sm"
              />
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="w-full flex items-end p-2 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[26px] shadow-floating focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/30 focus-within:bg-white/95 transition-all duration-300 ease-out relative z-30">
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*" 
          multiple
          onChange={handleFileSelect}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-3 mb-1 ml-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-200 group"
          title="Attach Image"
          disabled={isRunning}
        >
          <Paperclip size={20} className="group-hover:rotate-45 transition-transform" strokeWidth={2.5} />
        </button>

        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Ask a complex question..."
          rows={1}
          autoFocus
          className="flex-1 max-h-[200px] py-4 pl-3 pr-3 bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-900 placeholder:text-slate-400 leading-relaxed custom-scrollbar text-lg font-medium"
          style={{ minHeight: '56px' }}
        />

        <div className="flex-shrink-0 pb-1 pr-1">
          {isRunning ? (
            <button
              onClick={onStop}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white hover:bg-red-600 hover:rotate-90 transition-all duration-300 shadow-lg hover:shadow-red-500/30 active:scale-90"
            >
              <Square size={14} className="fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!query.trim() && attachments.length === 0}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 group"
            >
              <ArrowUp size={24} strokeWidth={3} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputSection;
