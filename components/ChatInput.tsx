import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, FileText, Video, Music, FileCode } from 'lucide-react';
import { AppState, MessageAttachment } from '../types';
import { fileToBase64 } from '../utils';

interface ChatInputProps {
  query: string;
  setQuery: (q: string) => void;
  onRun: (attachments: MessageAttachment[]) => boolean;
  onStop: () => void;
  appState: AppState;
  focusTrigger?: number;
  inputError?: string | null;
  onClearInputError?: () => void;
}

const ChatInput = ({
  query,
  setQuery,
  onRun,
  onStop,
  appState,
  focusTrigger,
  inputError,
  onClearInputError,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<MessageAttachment[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  attachmentsRef.current = attachments;

  const revokeAttachmentUrls = (items: MessageAttachment[]) => {
    items.forEach((attachment) => {
      if (attachment.url) {
        URL.revokeObjectURL(attachment.url);
      }
    });
  };

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

  useEffect(() => {
    return () => {
      revokeAttachmentUrls(attachmentsRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    adjustHeight();
  }, [query]);

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isText =
      file.type.startsWith('text/') ||
      ['application/json', 'application/javascript', 'application/x-javascript'].includes(
        file.type,
      ) ||
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
        url: isImage || isVideo || isAudio ? URL.createObjectURL(file) : undefined,
      };
      setAttachments((prev) => [...prev, newAttachment]);
    } catch (e) {
      console.error('Failed to process file', e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          onClearInputError?.();
          processFile(file);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onClearInputError?.();
      Array.from(e.target.files).forEach(processFile);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    onClearInputError?.();
    setAttachments((prev) => {
      const removed = prev.filter((a) => a.id === id);
      revokeAttachmentUrls(removed);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposing || e.nativeEvent.isComposing) {
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
    const didSubmit = onRun(attachments);
    if (didSubmit) {
      revokeAttachmentUrls(attachments);
      setAttachments([]);
    }
  };

  const isRunning = appState !== 'idle';

  return (
    <div className="w-full">
      {inputError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm"
        >
          {inputError}
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-3 mb-3 overflow-x-auto px-1 py-1 custom-scrollbar">
          {attachments.map((att) => (
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

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf,video/*,audio/*,text/*,.js,.ts,.tsx,.py,.json,.csv,.c,.cpp,.rs,.md"
        multiple
        onChange={handleFileSelect}
      />

      {/* Input Container */}
      <div
        role="form"
        aria-label="消息输入区域"
        className="w-full rounded-[26px] border border-slate-200 bg-white px-4 py-2 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.08),0_4px_6px_-4px_rgba(15,23,42,0.08)] transition-colors duration-200 focus-within:border-slate-700 focus-within:ring-1 focus-within:ring-slate-700 dark:border-slate-800 dark:bg-[#121214] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3),0_4px_6px_-4px_rgba(0,0,0,0.3)] dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500"
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => {
            onClearInputError?.();
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="提出问题..."
          aria-label="消息输入"
          enterKeyHint="send"
          rows={1}
          autoFocus
          className="w-full max-h-[200px] min-h-[38px] resize-none border-none bg-transparent px-1 pb-0 pt-0.5 text-base leading-6 text-slate-950 outline-none placeholder:text-slate-500 focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-600 custom-scrollbar"
        />

        <div
          data-testid="input-toolbar"
          className="flex w-full items-center justify-between gap-3 pt-1 max-[480px]:flex-col max-[480px]:items-stretch"
        >
          <div className="flex min-w-0 items-center gap-2 max-[480px]:flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-transparent px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              title="添加附件（图片、视频、PDF、音频、代码）"
              disabled={isRunning}
            >
              <Paperclip size={16} />
              <span>附件</span>
            </button>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3">
            {isRunning ? (
              <button
                onClick={onStop}
                aria-label="停止生成"
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-600 text-white transition-colors hover:bg-red-700"
              >
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                aria-label="发送消息"
                disabled={!query.trim() && attachments.length === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-blue-600 dark:hover:bg-blue-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
              >
                <ArrowUp size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
