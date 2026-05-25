import type { MessageAttachment } from '@/types';
import { fileToBase64 } from '@/utils';

const TEXT_ATTACHMENT_EXTENSIONS =
  /\.(js|ts|tsx|py|c|cpp|rs|md|csv|json|html|css|go|java|rb|php)$/i;
const TEXT_ATTACHMENT_MIME_TYPES = [
  'application/json',
  'application/javascript',
  'application/x-javascript',
];

export const getAttachmentType = (file: File): MessageAttachment['type'] | null => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (
    file.type.startsWith('text/') ||
    TEXT_ATTACHMENT_MIME_TYPES.includes(file.type) ||
    TEXT_ATTACHMENT_EXTENSIONS.test(file.name)
  ) {
    return 'document';
  }

  return null;
};

export const createAttachmentFromFile = async (file: File): Promise<MessageAttachment | null> => {
  const type = getAttachmentType(file);
  if (!type) return null;

  const base64 = await fileToBase64(file);
  const hasObjectUrl = type === 'image' || type === 'video' || type === 'audio';

  return {
    id: crypto.randomUUID(),
    type,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    data: base64,
    url: hasObjectUrl ? URL.createObjectURL(file) : undefined,
  };
};

export const revokeAttachmentUrls = (items: MessageAttachment[]) => {
  items.forEach((attachment) => {
    if (attachment.url) {
      URL.revokeObjectURL(attachment.url);
    }
  });
};

export const toPersistentAttachments = (items: MessageAttachment[]): MessageAttachment[] =>
  items.map((attachment) => ({
    id: attachment.id,
    type: attachment.type,
    name: attachment.name,
    mimeType: attachment.mimeType,
    data: attachment.data,
  }));
