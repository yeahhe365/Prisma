import React from 'react';
import { FileText, Download, FileCode } from 'lucide-react';
import { MessageAttachment } from '../types';

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
      {attachments.map(att => (
        att.type === 'image' ? (
          <img
            key={att.id}
            src={att.url || `data:${att.mimeType};base64,${att.data}`}
            alt="attachment"
            className={`h-48 w-48 object-cover rounded-lg border shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${
              isUser ? 'border-blue-200' : 'border-slate-200'
            }`}
            onClick={() => window.open(att.url || `data:${att.mimeType};base64,${att.data}`, '_blank')}
          />
        ) : att.type === 'video' ? (
          <div key={att.id} className="relative w-full max-w-md rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-black group/video">
            <video
              src={att.url || `data:${att.mimeType};base64,${att.data}`}
              controls
              className="w-full aspect-video"
            />
          </div>
        ) : att.type === 'audio' ? (
          <div key={att.id} className={`w-full max-w-sm flex flex-col gap-2 p-3 rounded-xl ${
            isUser ? 'bg-white/70 border border-blue-100' : 'bg-blue-50 border border-blue-100'
          }`}>
            <audio
              src={att.url || `data:${att.mimeType};base64,${att.data}`}
              controls
              className="w-full h-8"
            />
          </div>
        ) : (
          <div
            key={att.id}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer group/file ${
              isUser
                ? 'bg-white/70 border border-blue-100'
                : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors'
            }`}
            onClick={() => handleDownloadFile(att)}
          >
            <div className={`p-2 rounded-lg group-hover/file:scale-110 transition-transform ${
              att.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {att.type === 'pdf' ? <FileText size={24} /> : <FileCode size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                {att.name || (att.type === 'pdf' ? 'document.pdf' : 'file.txt')}
              </p>
              {!isUser && (
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  {att.type === 'pdf' ? 'PDF 文档' : '文本/代码文件'}
                </p>
              )}
            </div>
            <Download size={16} className="text-slate-400 group-hover/file:text-slate-600 ml-2" />
          </div>
        )
      ))}
    </div>
  );
};

export default AttachmentRenderer;
