import { describe, expect, it } from 'vitest';

import {
  buildGoogleContents,
  buildOpenAIContent,
  getUnsupportedOpenAIAttachments,
} from '@/services/deepThink/contentBuilder';
import type { MessageAttachment } from '@/types';

const textAttachment: MessageAttachment = {
  id: 'text-1',
  type: 'document',
  name: 'notes.txt',
  mimeType: 'text/plain',
  data: Buffer.from('hello from attachment', 'utf8').toString('base64'),
};

const imageAttachment: MessageAttachment = {
  id: 'image-1',
  type: 'image',
  name: 'diagram.png',
  mimeType: 'image/png',
  data: 'ZmFrZS1pbWFnZQ==',
};

const pdfAttachment: MessageAttachment = {
  id: 'pdf-1',
  type: 'pdf',
  name: 'paper.pdf',
  mimeType: 'application/pdf',
  data: 'ZmFrZS1wZGY=',
};

describe('OpenAI-compatible attachment handling', () => {
  it('inlines text attachments into the content payload', () => {
    const result = buildOpenAIContent('Summarize these notes.', [textAttachment, imageAttachment]);

    expect(Array.isArray(result.content)).toBe(true);
    expect(result.unsupportedAttachments).toEqual([]);

    if (!Array.isArray(result.content)) {
      throw new Error('expected multimodal content array');
    }

    expect(result.content[0]).toEqual({ type: 'text', text: 'Summarize these notes.' });
    expect(result.content[1]).toMatchObject({
      type: 'text',
    });
    if (!('text' in result.content[1])) {
      throw new Error('expected second content part to be text');
    }
    expect(result.content[1].text).toContain('notes.txt');
    expect(result.content[1].text).toContain('hello from attachment');
    expect(result.content[2]).toEqual({
      type: 'image_url',
      image_url: {
        url: 'data:image/png;base64,ZmFrZS1pbWFnZQ==',
      },
    });
  });

  it('flags pdf, video, and audio attachments as unsupported', () => {
    expect(getUnsupportedOpenAIAttachments([textAttachment, pdfAttachment])).toEqual([
      pdfAttachment,
    ]);

    const result = buildOpenAIContent('Read what is supported.', [pdfAttachment]);
    expect(result.content).toBe('Read what is supported.');
    expect(result.unsupportedAttachments).toEqual([pdfAttachment]);
  });
});

describe('Google attachment handling', () => {
  it('builds inline data parts for each attachment', () => {
    const result = buildGoogleContents('Inspect these files.', [textAttachment, imageAttachment]);

    expect(result).toEqual({
      role: 'user',
      parts: [
        { text: 'Inspect these files.' },
        {
          inlineData: {
            mimeType: 'text/plain',
            data: textAttachment.data,
          },
        },
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageAttachment.data,
          },
        },
      ],
    });
  });
});
