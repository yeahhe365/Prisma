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
          className="mb-3 rounded-2xl border border-[var(--theme-bg-danger)]/30 bg-[var(--theme-bg-error-message)] px-4 py-3 text-sm text-[var(--theme-text-danger)] shadow-sm"
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
                  className="h-16 w-16 rounded-lg border border-[var(--theme-border-secondary)] object-cover shadow-sm"
                />
              ) : att.type === 'video' ? (
                <div className="relative flex h-16 w-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg bg-[var(--theme-bg-code-block)] p-2 shadow-sm">
                  <Video size={20} className="text-white/50" />
                  <span className="text-[8px] font-medium text-white/70 truncate w-full text-center px-1">
                    {att.name || 'video.mp4'}
                  </span>
                </div>
              ) : att.type === 'audio' ? (
                <div className="flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-2 shadow-sm">
                  <Music size={20} className="text-[var(--theme-text-link)]" />
                  <span className="w-full truncate px-1 text-center text-[8px] font-medium text-[var(--theme-text-secondary)]">
                    {att.name || 'audio.mp3'}
                  </span>
                </div>
              ) : att.type === 'pdf' ? (
                <div className="flex h-16 w-32 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-2 shadow-sm">
                  <FileText size={20} className="text-[var(--theme-text-danger)]" />
                  <span className="w-full truncate px-1 text-center text-[10px] font-medium text-[var(--theme-text-secondary)]">
                    {att.name || 'document.pdf'}
                  </span>
                </div>
              ) : (
                <div className="flex h-16 w-32 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-2 shadow-sm">
                  <FileCode size={20} className="text-[var(--theme-text-link)]" />
                  <span className="w-full truncate px-1 text-center text-[10px] font-medium text-[var(--theme-text-secondary)]">
                    {att.name || 'file.txt'}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -right-2 -top-2 z-10 rounded-full bg-[var(--theme-bg-accent)] p-1 text-[var(--theme-text-accent)] opacity-100 shadow-md transition-colors hover:bg-[var(--theme-bg-danger)]"
                aria-label="移除附件"
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
        className="w-full rounded-[26px] border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-3 py-1.5 shadow-lg transition-colors duration-200 focus-within:border-[var(--theme-border-focus)] focus-within:ring-1 focus-within:ring-[var(--theme-border-focus)] sm:px-4 sm:py-2"
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
          className="custom-scrollbar max-h-[200px] min-h-[34px] w-full resize-none border-none bg-transparent px-1 pb-0 pt-0.5 text-base leading-6 text-[var(--theme-text-primary)] outline-none placeholder:text-[var(--theme-text-tertiary)] focus:ring-0 sm:min-h-[38px]"
        />

        <div
          data-testid="input-toolbar"
          className="flex w-full items-center justify-between gap-3 pt-1"
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-transparent px-3 text-sm font-medium text-[var(--theme-icon-attach)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
              title="添加附件（图片、视频、PDF、音频、代码）"
              disabled={isRunning}
            >
              <Paperclip size={16} />
              <span>附件</span>
            </button>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            {isRunning ? (
              <button
                onClick={onStop}
                aria-label="停止生成"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--theme-bg-danger)] text-[var(--theme-icon-stop)] transition-colors hover:bg-[var(--theme-bg-danger-hover)]"
              >
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                aria-label="发送消息"
                disabled={!query.trim() && attachments.length === 0}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--theme-bg-accent)] text-[var(--theme-icon-send)] transition-colors hover:bg-[var(--theme-bg-accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--theme-bg-tertiary)] disabled:text-[var(--theme-text-tertiary)]"
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
