import { MessageAttachment } from '../../types';

interface TextPart { text: string }
interface InlineDataPart { inlineData: { mimeType: string; data: string } }
interface ImageUrlPart { type: 'image_url'; image_url: { url: string } }

/**
 * Build Google GenAI SDK contents object with inline data for attachments.
 * Note: For PDFs and other file types, Google recommends using the File API (uploadAsync)
 * rather than inlineData. This fallback sends all attachments as inlineData,
 * which works for small files but may fail for large ones.
 */
export const buildGoogleContents = (text: string, attachments: MessageAttachment[]) => {
  const parts: Array<TextPart | InlineDataPart> = [{ text }];

  if (attachments.length > 0) {
    attachments.forEach(att => {
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

/**
 * Build OpenAI-compatible content payload (string or multimodal array).
 * Note: OpenAI API only supports image_url for vision. Non-image attachments
 * (PDF, video, audio, document) are not supported and will be silently dropped.
 */
export const buildOpenAIContent = (text: string, attachments: MessageAttachment[]): string | Array<TextPart | ImageUrlPart> => {
  const imageAttachments = attachments.filter(a => a.type === 'image');

  if (imageAttachments.length === 0) {
    return text;
  }

  const payload: Array<TextPart | ImageUrlPart> = [{ type: 'text', text }];
  imageAttachments.forEach(att => {
    payload.push({
      type: 'image_url',
      image_url: {
        url: `data:${att.mimeType};base64,${att.data}`,
      },
    });
  });

  return payload;
};
