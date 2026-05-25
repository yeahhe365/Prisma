import React from 'react';
import { FileCode, FileText, Music, Video, X } from 'lucide-react';
import type { MessageAttachment } from '@/types';

interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  onRemove: (id: string) => void;
}

const attachmentTileClass =
  'flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-2 shadow-sm';

const AttachmentPreview = ({ attachment, onRemove }: AttachmentPreviewProps) => {
  const renderPreview = () => {
    if (attachment.type === 'image') {
      return (
        <img
          src={attachment.url}
          alt="attachment"
          className="h-16 w-16 rounded-lg border border-[var(--theme-border-secondary)] object-cover shadow-sm"
        />
      );
    }

    if (attachment.type === 'video') {
      return (
        <div className="relative flex h-16 w-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg bg-[var(--theme-bg-code-block)] p-2 shadow-sm">
          <Video size={20} className="text-white/50" />
          <span className="w-full truncate px-1 text-center text-[8px] font-medium text-white/70">
            {attachment.name || 'video.mp4'}
          </span>
        </div>
      );
    }

    if (attachment.type === 'audio') {
      return (
        <div className={`${attachmentTileClass} w-24`}>
          <Music size={20} className="text-[var(--theme-text-link)]" />
          <span className="w-full truncate px-1 text-center text-[8px] font-medium text-[var(--theme-text-secondary)]">
            {attachment.name || 'audio.mp3'}
          </span>
        </div>
      );
    }

    if (attachment.type === 'pdf') {
      return (
        <div className={`${attachmentTileClass} w-32`}>
          <FileText size={20} className="text-[var(--theme-text-danger)]" />
          <span className="w-full truncate px-1 text-center text-[10px] font-medium text-[var(--theme-text-secondary)]">
            {attachment.name || 'document.pdf'}
          </span>
        </div>
      );
    }

    return (
      <div className={`${attachmentTileClass} w-32`}>
        <FileCode size={20} className="text-[var(--theme-text-link)]" />
        <span className="w-full truncate px-1 text-center text-[10px] font-medium text-[var(--theme-text-secondary)]">
          {attachment.name || 'file.txt'}
        </span>
      </div>
    );
  };

  return (
    <div className="group relative shrink-0">
      {renderPreview()}
      <button
        type="button"
        onClick={() => onRemove(attachment.id)}
        className="absolute -right-2 -top-2 z-10 rounded-full bg-[var(--theme-bg-accent)] p-1 text-[var(--theme-text-accent)] opacity-100 shadow-md transition-colors hover:bg-[var(--theme-bg-danger)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg-input)]"
        aria-label="移除附件"
      >
        <X size={10} />
      </button>
    </div>
  );
};

export default AttachmentPreview;
