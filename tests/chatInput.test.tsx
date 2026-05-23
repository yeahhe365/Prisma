// @vitest-environment jsdom

import React from 'react';
import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChatInput from '../components/ChatInput';

describe('ChatInput', () => {
  beforeEach(() => {
    const createObjectURL = vi.fn(() => 'blob:preview-url');
    const revokeObjectURL = vi.fn();

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectURL,
    });

    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;

      readAsDataURL(file: File) {
        if (file.name === 'broken.png') {
          queueMicrotask(() => {
            this.onerror?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
          });
          return;
        }

        this.result = `data:${file.type};base64,ZmFrZS1kYXRh`;
        queueMicrotask(() => {
          this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
        });
      }
    }

    vi.stubGlobal('FileReader', MockFileReader);
  });

  it('uses a JustSearch-style stacked input box with a bottom toolbar', () => {
    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    const form = screen.getByRole('form', { name: '消息输入区域' });
    const textarea = screen.getByPlaceholderText('提出问题...');
    const toolbar = screen.getByTestId('input-toolbar');
    const attachmentButton = screen.getByTitle('添加附件（图片、视频、PDF、音频、代码）');
    const sendButton = screen.getByRole('button', { name: '发送消息' });

    expect(form.contains(textarea)).toBe(true);
    expect(form.contains(toolbar)).toBe(true);
    expect(toolbar.contains(attachmentButton)).toBe(true);
    expect(toolbar.contains(sendButton)).toBe(true);
    expect(form.firstElementChild).toBe(textarea);
    expect(form.lastElementChild).toBe(toolbar);
  });

  it('uses AMC-style composer tokens and icon button sizing', () => {
    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    const form = screen.getByRole('form', { name: '消息输入区域' });
    const attachmentButton = screen.getByTitle('添加附件（图片、视频、PDF、音频、代码）');
    const sendButton = screen.getByRole('button', { name: '发送消息' });

    expect(form.className).toContain('border-[var(--theme-border-secondary)]');
    expect(form.className).toContain('bg-[var(--theme-bg-input)]');
    expect(form.className).toContain('focus-within:border-[var(--theme-border-focus)]');
    expect(attachmentButton.className).toContain('text-[var(--theme-icon-attach)]');
    expect(sendButton.className).toContain('h-11');
    expect(sendButton.className).toContain('bg-[var(--theme-bg-accent)]');
  });

  it('announces input errors through an alert region and clears them on typing', async () => {
    const user = userEvent.setup();
    const clearInputError = vi.fn();

    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
        inputError="当前模型仅支持图片和文本/代码附件"
        onClearInputError={clearInputError}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain('当前模型仅支持图片和文本/代码附件');

    await user.type(screen.getByPlaceholderText('提出问题...'), 'hi');

    expect(clearInputError).toHaveBeenCalled();
  });

  it('clears uploaded attachments after a successful submit and releases object urls', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn(() => true);

    render(
      <ChatInput query="" setQuery={vi.fn()} onRun={onRun} onStop={vi.fn()} appState="idle" />,
    );

    const file = new File(['image'], 'diagram.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [file],
    });
    fireEvent.change(fileInput);
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    });
    expect(await screen.findByAltText('attachment')).toBeTruthy();

    await user.type(screen.getByPlaceholderText('提出问题...'), '{enter}');

    expect(onRun).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'diagram.png',
        type: 'image',
      }),
    ]);
    expect(screen.queryByAltText('attachment')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-url');
  });

  it('keeps attachments when submit is rejected by validation', async () => {
    const user = userEvent.setup();

    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    const file = new File(['image'], 'diagram.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [file],
    });
    fireEvent.change(fileInput);
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    });
    await user.type(screen.getByPlaceholderText('提出问题...'), '{enter}');

    expect(await screen.findByAltText('attachment')).toBeTruthy();
  });

  it('removes an uploaded attachment and revokes its object url', async () => {
    const user = userEvent.setup();

    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    const file = new File(['image'], 'diagram.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [file],
    });
    fireEvent.change(fileInput);

    const preview = await screen.findByAltText('attachment');
    expect(preview).toBeTruthy();

    const removeButton = preview.parentElement?.querySelector('button');
    if (!removeButton) {
      throw new Error('expected remove button for attachment preview');
    }
    await user.click(removeButton);

    expect(screen.queryByAltText('attachment')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-url');
  });

  it('shows the stop action while a run is in progress', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();

    render(
      <ChatInput
        query="hello"
        setQuery={vi.fn()}
        onRun={vi.fn(() => true)}
        onStop={onStop}
        appState="synthesizing"
      />,
    );

    await user.click(screen.getByRole('button', { name: '停止生成' }));

    expect(onStop).toHaveBeenCalled();
  });

  it('ignores unsupported attachment types', async () => {
    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    const file = new File(['zip'], 'archive.zip', { type: 'application/zip' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [file],
    });
    fireEvent.change(fileInput);

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.queryByText('archive.zip')).toBeNull();
  });

  it('renders non-image attachment previews for pdf, video, audio, and code files', async () => {
    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    const files = [
      new File(['pdf'], 'paper.pdf', { type: 'application/pdf' }),
      new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
      new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' }),
      new File(['code'], 'main.ts', { type: 'application/octet-stream' }),
    ];
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: files,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('paper.pdf')).toBeTruthy();
      expect(screen.getByText('clip.mp4')).toBeTruthy();
      expect(screen.getByText('voice.mp3')).toBeTruthy();
      expect(screen.getByText('main.ts')).toBeTruthy();
    });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('handles pasted images and ignores enter while composing', async () => {
    const onRun = vi.fn(() => true);
    const clearInputError = vi.fn();

    render(
      <ChatInput
        query="hello"
        setQuery={vi.fn()}
        onRun={onRun}
        onStop={vi.fn()}
        appState="idle"
        onClearInputError={clearInputError}
      />,
    );

    const pastedImage = new File(['image'], 'paste.png', { type: 'image/png' });
    const preventDefault = vi.fn();

    const pasteEvent = createEvent.paste(screen.getByPlaceholderText('提出问题...'));
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => pastedImage,
          },
        ],
      },
    });
    pasteEvent.preventDefault = preventDefault;
    fireEvent(screen.getByPlaceholderText('提出问题...'), pasteEvent);

    await waitFor(() => {
      expect(preventDefault).toHaveBeenCalled();
      expect(clearInputError).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalledWith(pastedImage);
    });

    fireEvent.compositionStart(screen.getByPlaceholderText('提出问题...'));
    fireEvent.keyDown(screen.getByPlaceholderText('提出问题...'), {
      key: 'Enter',
      shiftKey: false,
      nativeEvent: { isComposing: true },
    });

    expect(onRun).not.toHaveBeenCalled();
  });

  it('submits after composition ends and enter is pressed again', async () => {
    const onRun = vi.fn(() => true);

    render(
      <ChatInput query="hello" setQuery={vi.fn()} onRun={onRun} onStop={vi.fn()} appState="idle" />,
    );

    const textarea = screen.getByPlaceholderText('提出问题...');

    fireEvent.compositionStart(textarea);
    fireEvent.keyDown(textarea, {
      key: 'Enter',
      shiftKey: false,
      nativeEvent: { isComposing: true },
    });
    expect(onRun).not.toHaveBeenCalled();

    fireEvent.compositionEnd(textarea);
    fireEvent.keyDown(textarea, {
      key: 'Enter',
      shiftKey: false,
      nativeEvent: { isComposing: false },
    });

    expect(onRun).toHaveBeenCalled();
  });

  it('opens the hidden file input when the attachment button is clicked', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    await user.click(screen.getByTitle('添加附件（图片、视频、PDF、音频、代码）'));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('logs and skips attachments that fail to convert', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ChatInput
        query=""
        setQuery={vi.fn()}
        onRun={vi.fn(() => false)}
        onStop={vi.fn()}
        appState="idle"
      />,
    );

    const file = new File(['broken'], 'broken.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [file],
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    expect(screen.queryByAltText('attachment')).toBeNull();
  });
});
