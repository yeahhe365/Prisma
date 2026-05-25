import type { MessageAttachment } from '@/types';

interface TextPart {
  text: string;
}
interface InlineDataPart {
  inlineData: { mimeType: string; data: string };
}
export interface OpenAITextPart {
  type: 'text';
  text: string;
}
export interface OpenAIImageUrlPart {
  type: 'image_url';
  image_url: { url: string };
}

type OpenAIContentPart = OpenAITextPart | OpenAIImageUrlPart;
type OpenAIUnsupportedAttachment = Extract<MessageAttachment['type'], 'pdf' | 'video' | 'audio'>;

const OPENAI_UNSUPPORTED_ATTACHMENT_TYPES = new Set<OpenAIUnsupportedAttachment>([
  'pdf',
  'video',
  'audio',
]);

const decodeBase64Text = (data: string): string => {
  try {
    const binary = atob(data);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
};

const buildAttachmentTextBlock = (attachment: MessageAttachment): string | null => {
  if (attachment.type !== 'document') return null;

  const decodedText = decodeBase64Text(attachment.data).trim();
  if (!decodedText) return null;

  return `Attachment: ${attachment.name || 'document'}\n${decodedText}`;
};

/**
 * Build Google GenAI SDK contents object with inline data for attachments.
 * Note: For PDFs and other file types, Google recommends using the File API (uploadAsync)
 * rather than inlineData. This fallback sends all attachments as inlineData,
 * which works for small files but may fail for large ones.
 */
export const buildGoogleContents = (text: string, attachments: MessageAttachment[]) => {
  const parts: Array<TextPart | InlineDataPart> = [{ text }];

  if (attachments.length > 0) {
    attachments.forEach((att) => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data,
        },
      });
    });
  }

  return { role: 'user' as const, parts };
};

export const getUnsupportedOpenAIAttachments = (
  attachments: MessageAttachment[],
): MessageAttachment[] => {
  return attachments.filter((attachment): attachment is MessageAttachment =>
    OPENAI_UNSUPPORTED_ATTACHMENT_TYPES.has(attachment.type as OpenAIUnsupportedAttachment),
  );
};

/**
 * Build OpenAI-compatible content payload.
 * Text/code attachments are converted into additional text parts.
 * PDF/video/audio attachments are returned separately so the UI can block them.
 */
export const buildOpenAIContent = (
  text: string,
  attachments: MessageAttachment[],
): {
  content: string | OpenAIContentPart[];
  unsupportedAttachments: MessageAttachment[];
} => {
  const imageAttachments = attachments.filter((a) => a.type === 'image');
  const textAttachments = attachments
    .map(buildAttachmentTextBlock)
    .filter((value): value is string => Boolean(value));
  const unsupportedAttachments = getUnsupportedOpenAIAttachments(attachments);

  if (imageAttachments.length === 0 && textAttachments.length === 0) {
    return { content: text, unsupportedAttachments };
  }

  const payload: OpenAIContentPart[] = [{ type: 'text', text }];

  textAttachments.forEach((attachmentText) => {
    payload.push({
      type: 'text',
      text: attachmentText,
    });
  });

  imageAttachments.forEach((att) => {
    payload.push({
      type: 'image_url',
      image_url: {
        url: `data:${att.mimeType};base64,${att.data}`,
      },
    });
  });

  return { content: payload, unsupportedAttachments };
};
