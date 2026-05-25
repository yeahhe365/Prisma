import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MarkdownRenderer from '@/components/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders content inside the AMC-style markdown body wrapper', () => {
    const { container } = render(<MarkdownRenderer content={'# 标题\n\n正文'} />);

    expect(container.firstElementChild?.className).toContain('markdown-body');
    expect(screen.getByRole('heading', { name: '标题' })).toBeTruthy();
  });

  it('marks streaming content with the AMC loading class while still rendering markdown', () => {
    const { container } = render(<MarkdownRenderer content={'## 流式标题'} isStreaming />);

    expect(container.firstElementChild?.className).toContain('markdown-body');
    expect(container.firstElementChild?.className).toContain('is-loading');
    expect(screen.getByRole('heading', { name: '流式标题' })).toBeTruthy();
  });

  it('does not show copied state when copying a code block fails', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('clipboard blocked'));

    render(<MarkdownRenderer content={'```ts\nconst answer = 42;\n```'} />);

    await user.click(screen.getByRole('button', { name: '复制代码' }));

    expect(screen.queryByRole('button', { name: '已复制' })).toBeNull();
    expect(screen.queryByText(/lines/i)).toBeNull();
    expect(screen.queryByText(/copy/i)).toBeNull();
  });

  it('uses AMC-style controls for code blocks', () => {
    render(<MarkdownRenderer content={'```ts\nconst answer = 42;\n```'} />);

    expect(screen.getByRole('button', { name: '下载 ts 代码' }).className).toContain('min-h-10');
    expect(screen.getByRole('button', { name: '复制代码' }).className).toContain('min-h-10');
    expect(document.querySelector('[data-code-header-toolbar]')).toBeTruthy();
  });

  it('wraps GitHub-flavored tables in the AMC-style table block', () => {
    render(
      <MarkdownRenderer content={'| 名称 | 值 |\n| --- | --- |\n| alpha | 1 |\n| beta | 2 |'} />,
    );

    const tableBlock = screen.getByTestId('markdown-table-block');

    expect(tableBlock.className).toContain('rounded-xl');
    expect(tableBlock.className).toContain('border');
    expect(screen.getByRole('button', { name: '复制表格' })).toBeTruthy();
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('opens external links in a new tab like AMC', () => {
    render(<MarkdownRenderer content={'[OpenAI](https://openai.com) 和 [本地](/settings)'} />);

    const externalLink = screen.getByRole('link', { name: 'OpenAI' });
    const internalLink = screen.getByRole('link', { name: '本地' });

    expect(externalLink.getAttribute('target')).toBe('_blank');
    expect(externalLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(internalLink.getAttribute('target')).toBeNull();
  });

  it('strips unsafe markdown link protocols', () => {
    render(
      <MarkdownRenderer content={'[bad](javascript:alert(1)) [ok](mailto:test@example.com)'} />,
    );

    expect(screen.getByText('bad').closest('a')?.getAttribute('href')).toBe('');
    expect(screen.getByRole('link', { name: 'ok' }).getAttribute('href')).toBe(
      'mailto:test@example.com',
    );
  });
});
