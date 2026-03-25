import { MessageAttachment } from '../types';

/**
 * Build Google GenAI SDK contents object with inline data for attachments.
 */
export const buildGoogleContents = (text: string, attachments: MessageAttachment[]) => {
  const contents: any = {
    role: 'user',
    parts: [{ text }],
  };

  if (attachments.length > 0) {
    attachments.forEach(att => {
      contents.parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data,
        },
      });
    });
  }

  return contents;
};

/**
 * Build OpenAI-compatible content payload (string or multimodal array).
 */
export const buildOpenAIContent = (text: string, attachments: MessageAttachment[]) => {
  const imageAttachments = attachments.filter(a => a.type === 'image');

  if (imageAttachments.length === 0) {
    return text;
  }

  const payload: any[] = [{ type: 'text', text }];
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
