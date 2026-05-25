import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAttachmentFromFile,
  getAttachmentType,
  revokeAttachmentUrls,
  toPersistentAttachments,
} from '@/services/attachments';

describe('attachment helpers', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:preview-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });

    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'attachment-id'),
    });

    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;

      readAsDataURL(file: File) {
        this.result = `data:${file.type};base64,ZmFrZS1kYXRh`;
        queueMicrotask(() => {
          this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
        });
      }
    }

    vi.stubGlobal('FileReader', MockFileReader);
  });

  it('detects supported attachment categories from mime type and extension', () => {
    expect(getAttachmentType(new File(['image'], 'diagram.png', { type: 'image/png' }))).toBe(
      'image',
    );
    expect(getAttachmentType(new File(['pdf'], 'paper.pdf', { type: 'application/pdf' }))).toBe(
      'pdf',
    );
    expect(getAttachmentType(new File(['video'], 'clip.mp4', { type: 'video/mp4' }))).toBe('video');
    expect(getAttachmentType(new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' }))).toBe(
      'audio',
    );
    expect(
      getAttachmentType(new File(['code'], 'main.ts', { type: 'application/octet-stream' })),
    ).toBe('document');
    expect(getAttachmentType(new File(['zip'], 'archive.zip', { type: 'application/zip' }))).toBe(
      null,
    );
  });

  it('creates previews only for media attachment types', async () => {
    const image = new File(['image'], 'diagram.png', { type: 'image/png' });
    const text = new File(['text'], 'notes.md', { type: 'text/markdown' });

    await expect(createAttachmentFromFile(image)).resolves.toMatchObject({
      id: 'attachment-id',
      type: 'image',
      name: 'diagram.png',
      data: 'ZmFrZS1kYXRh',
      url: 'blob:preview-url',
    });
    await expect(createAttachmentFromFile(text)).resolves.toMatchObject({
      type: 'document',
      name: 'notes.md',
      url: undefined,
    });
  });

  it('releases only object urls that exist', () => {
    revokeAttachmentUrls([
      {
        id: '1',
        type: 'image',
        name: 'diagram.png',
        mimeType: 'image/png',
        data: 'ZmFrZS1kYXRh',
        url: 'blob:preview-url',
      },
      {
        id: '2',
        type: 'document',
        name: 'notes.md',
        mimeType: 'text/markdown',
        data: 'ZmFrZS1kYXRh',
      },
    ]);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-url');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('strips temporary preview urls from persisted attachments', () => {
    expect(
      toPersistentAttachments([
        {
          id: '1',
          type: 'image',
          name: 'diagram.png',
          mimeType: 'image/png',
          data: 'ZmFrZS1kYXRh',
          url: 'blob:preview-url',
        },
      ]),
    ).toEqual([
      {
        id: '1',
        type: 'image',
        name: 'diagram.png',
        mimeType: 'image/png',
        data: 'ZmFrZS1kYXRh',
      },
    ]);
  });
});
