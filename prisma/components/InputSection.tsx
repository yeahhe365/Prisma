
import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, FileText, Video, Music, FileCode } from 'lucide-react';
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
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  useEffect(() => {
    if (appState === 'idle' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [appState, focusTrigger]);

  useLayoutEffect(() => {
    adjustHeight();
  }, [query]);

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isText = file.type.startsWith('text/') || 
                   ['application/json', 'application/javascript', 'application/x-javascript'].includes(file.type) ||
                   file.name.match(/\.(js|ts|tsx|py|c|cpp|rs|md|csv|json|html|css|go|java|rb|php)$/i);
    
    if (!isImage && !isPdf && !isVideo && !isAudio && !isText) return;
    
    try {
      const base64 = await fileToBase64(file);
      let type: MessageAttachment['type'] = 'document';
      if (isImage) type = 'image';
      else if (isPdf) type = 'pdf';
      else if (isVideo) type = 'video';
      else if (isAudio) type = 'audio';
      
      const newAttachment: MessageAttachment = {
        id: Math.random().toString(36).substring(7),
        type,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64,
        url: (isImage || isVideo || isAudio) ? URL.createObjectURL(file) : undefined
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
        <div className="flex gap-3 mb-3 overflow-x-auto px-1 py-1 custom-scrollbar">
          {attachments.map(att => (
            <div key={att.id} className="relative group shrink-0">
              {att.type === 'image' ? (
                <img 
                  src={att.url} 
                  alt="attachment" 
                  className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
              ) : att.type === 'video' ? (
                <div className="h-16 w-24 bg-slate-900 rounded-lg flex flex-col items-center justify-center p-2 gap-1 shadow-sm overflow-hidden relative">
                   <Video size={20} className="text-white/50" />
                   <span className="text-[8px] font-medium text-white/70 truncate w-full text-center px-1">
                    {att.name || 'video.mp4'}
                  </span>
                </div>
              ) : att.type === 'audio' ? (
                <div className="h-16 w-24 bg-blue-50 border border-blue-100 rounded-lg flex flex-col items-center justify-center p-2 gap-1 shadow-sm">
                   <Music size={20} className="text-blue-500" />
                   <span className="text-[8px] font-medium text-slate-600 truncate w-full text-center px-1">
                    {att.name || 'audio.mp3'}
                  </span>
                </div>
              ) : att.type === 'pdf' ? (
                <div className="h-16 w-32 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-2 gap-1 shadow-sm">
                  <FileText size={20} className="text-red-500" />
                  <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center px-1">
                    {att.name || 'document.pdf'}
                  </span>
                </div>
              ) : (
                <div className="h-16 w-32 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-2 gap-1 shadow-sm">
                  <FileCode size={20} className="text-blue-600" />
                  <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center px-1">
                    {att.name || 'file.txt'}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 opacity-100 shadow-md hover:bg-red-600 transition-colors z-10"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="w-full flex items-end p-2 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[26px] shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white/90 transition-colors duration-200">
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*,application/pdf,video/*,audio/*,text/*,.js,.ts,.tsx,.py,.json,.csv,.c,.cpp,.rs,.md" 
          multiple
          onChange={handleFileSelect}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2.5 mb-0.5 ml-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Attach Files (Images, Videos, PDFs, Audio, Code)"
          disabled={isRunning}
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="Ask about images, videos, audio, or files..."
          rows={1}
          autoFocus
          className="flex-1 max-h-[200px] py-3 pl-2 pr-2 bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-800 placeholder:text-slate-400 leading-relaxed custom-scrollbar text-base"
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
              onClick={handleSubmit}
              disabled={!query.trim() && attachments.length === 0}
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
