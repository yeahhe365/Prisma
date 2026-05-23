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

const chatInputButtonClass =
  'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-0 p-0 leading-none transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-input)] disabled:cursor-not-allowed disabled:opacity-50';

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
      const minHeight = 26;
      const maxHeight = 200;
      textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;

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
  const focusBlockingSelector =
    'button, a, input, textarea, select, label, summary, audio, video, [role="button"], [role="menuitem"], [contenteditable="true"]';

  const handleInputShellClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest(focusBlockingSelector)) {
      return;
    }

    textareaRef.current?.focus();
  };

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
        onClick={handleInputShellClick}
        className="relative z-20 flex w-full flex-col gap-1.5 rounded-[26px] border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-3 py-1.5 shadow-lg transition-colors duration-200 focus-within:border-[var(--theme-border-focus)] sm:px-4 sm:py-2"
      >
        {attachments.length > 0 && (
          <div className="custom-scrollbar flex gap-3 overflow-x-auto px-1 py-1">
            {attachments.map((att) => (
              <div key={att.id} className="group relative shrink-0">
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt="attachment"
                    className="h-16 w-16 rounded-lg border border-[var(--theme-border-secondary)] object-cover shadow-sm"
                  />
                ) : att.type === 'video' ? (
                  <div className="relative flex h-16 w-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg bg-[var(--theme-bg-code-block)] p-2 shadow-sm">
                    <Video size={20} className="text-white/50" />
                    <span className="w-full truncate px-1 text-center text-[8px] font-medium text-white/70">
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
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -right-2 -top-2 z-10 rounded-full bg-[var(--theme-bg-accent)] p-1 text-[var(--theme-text-accent)] opacity-100 shadow-md transition-colors hover:bg-[var(--theme-bg-danger)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-input)]"
                  aria-label="移除附件"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex min-h-0 w-full flex-grow cursor-text flex-col">
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
            data-chat-input-textarea="true"
            className="custom-scrollbar max-h-[200px] min-h-[26px] w-full flex-grow resize-none border-0 bg-transparent px-1 pb-0 pt-0.5 text-base leading-6 text-[var(--theme-text-primary)] outline-none placeholder:text-[var(--theme-text-tertiary)] focus:outline-none focus:ring-0 focus-visible:!outline-none"
          />
        </div>

        <div
          data-testid="input-toolbar"
          className="flex w-full items-center justify-between gap-2 overflow-visible pt-1"
        >
          <div
            data-testid="input-toolbar-left"
            className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${chatInputButtonClass} bg-transparent text-[var(--theme-icon-attach)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)]`}
              title="添加附件（图片、视频、PDF、音频、代码）"
              aria-label="添加附件"
              disabled={isRunning}
            >
              <Paperclip size={18} strokeWidth={2} />
            </button>
          </div>

          <div
            data-testid="input-toolbar-right"
            className="flex min-w-0 flex-shrink-0 items-center justify-end gap-1.5 sm:gap-3"
          >
            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="停止生成"
                className={`${chatInputButtonClass} !h-10 !w-10 !rounded-[10px] bg-[var(--theme-bg-danger)] text-[var(--theme-icon-stop)] shadow-sm hover:bg-[var(--theme-bg-danger-hover)]`}
              >
                <Square size={10} className="fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                aria-label="发送消息"
                disabled={!query.trim() && attachments.length === 0}
                className={`${chatInputButtonClass} !h-10 !w-10 bg-[var(--theme-bg-accent)] text-[var(--theme-icon-send)] shadow-sm hover:bg-[var(--theme-bg-accent-hover)] disabled:bg-[var(--theme-bg-tertiary)] disabled:text-[var(--theme-text-tertiary)]`}
              >
                <ArrowUp size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
