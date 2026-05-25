import React from 'react';
import { FileText, Download, FileCode } from 'lucide-react';
import type { MessageAttachment } from '@/types';

interface AttachmentRendererProps {
  attachments: MessageAttachment[];
  variant?: 'user' | 'ai';
}

const AttachmentRenderer = ({ attachments, variant = 'user' }: AttachmentRendererProps) => {
  const handleDownloadFile = (att: MessageAttachment) => {
    const link = document.createElement('a');
    link.href = att.url || `data:${att.mimeType};base64,${att.data}`;
    link.download = att.name || 'file';
    link.click();
  };

  const isUser = variant === 'user';

  return (
    <div className={`flex flex-wrap gap-4 ${isUser ? 'mb-3' : 'mb-4'}`}>
      {attachments.map((att) =>
        att.type === 'image' ? (
          <img
            key={att.id}
            src={att.url || `data:${att.mimeType};base64,${att.data}`}
            alt="attachment"
            className="h-48 w-48 cursor-pointer rounded-lg border border-[var(--theme-border-secondary)] object-cover shadow-sm transition-opacity hover:opacity-90"
            onClick={() =>
              window.open(att.url || `data:${att.mimeType};base64,${att.data}`, '_blank')
            }
          />
        ) : att.type === 'video' ? (
          <div
            key={att.id}
            className="group/video relative w-full max-w-md overflow-hidden rounded-xl border border-[var(--theme-border-secondary)] bg-black shadow-lg"
          >
            <video
              src={att.url || `data:${att.mimeType};base64,${att.data}`}
              controls
              className="w-full aspect-video"
            />
          </div>
        ) : att.type === 'audio' ? (
          <div
            key={att.id}
            className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-3"
          >
            <audio
              src={att.url || `data:${att.mimeType};base64,${att.data}`}
              controls
              className="w-full h-8"
            />
          </div>
        ) : (
          <div
            key={att.id}
            className="group/file flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-3 transition-colors hover:bg-[var(--theme-bg-tertiary)]/50"
            onClick={() => handleDownloadFile(att)}
          >
            <div
              className={`p-2 rounded-lg group-hover/file:scale-110 transition-transform ${
                att.type === 'pdf'
                  ? 'bg-[var(--theme-bg-danger)]/10 text-[var(--theme-text-danger)]'
                  : 'bg-[var(--theme-bg-info)] text-[var(--theme-text-link)]'
              }`}
            >
              {att.type === 'pdf' ? <FileText size={24} /> : <FileCode size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="max-w-[200px] truncate text-sm font-medium text-[var(--theme-text-primary)]">
                {att.name || (att.type === 'pdf' ? 'document.pdf' : 'file.txt')}
              </p>
              {!isUser && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                  {att.type === 'pdf' ? 'PDF 文档' : '文本/代码文件'}
                </p>
              )}
            </div>
            <Download
              size={16}
              className="ml-2 text-[var(--theme-text-tertiary)] group-hover/file:text-[var(--theme-text-primary)]"
            />
          </div>
        ),
      )}
    </div>
  );
};

export default AttachmentRenderer;
