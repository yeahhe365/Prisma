import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ChatMessage from '@/components/ChatMessage';

describe('ChatMessage', () => {
  it('uses AMC-style model message layout with a side action column', () => {
    render(
      <ChatMessage
        message={{ id: 'model-1', role: 'model', content: 'answer' }}
        onRetryMessage={vi.fn()}
        onDeleteMessage={vi.fn()}
        onContinueGeneration={vi.fn()}
        onForkMessage={vi.fn()}
      />,
    );

    const wrapper = document.querySelector('[data-message-id="model-1"]');
    const row = screen.getByTestId('message-row');
    const actionsColumn = screen.getByTestId('message-actions-column');
    const actions = screen.getByTestId('message-actions');
    const bubble = screen.getByTestId('message-bubble');

    expect(wrapper?.getAttribute('data-message-role')).toBe('model');
    expect(row.className).toContain('items-start');
    expect(row.className).toContain('justify-start');
    expect(actionsColumn.className).toContain('sticky');
    expect(actionsColumn.className).toContain('w-8');
    expect(actions.className).toContain('message-actions');
    expect(actions.className).toContain('opacity-0');
    expect(actions.className).toContain('group-hover:opacity-100');
    expect(bubble.className).toContain('message-content-container');
    expect(bubble.className).toContain('w-full');
    expect(bubble.className).toContain('max-w-[calc(100%-2.5rem)]');
    expect(bubble.className).toContain('sm:max-w-3xl');
    expect(bubble.className).toContain('lg:max-w-4xl');
    expect(bubble.className).toContain('xl:max-w-5xl');
    expect(screen.queryByText('Prisma')).toBeNull();
    expect(screen.getByRole('button', { name: '重新生成' }).className).toContain('rounded-lg');
    expect(screen.getByRole('button', { name: '更多操作' }).className).toContain('rounded-lg');
    expect(screen.getByTitle('复制消息').className).toContain('rounded-lg');
    expect(screen.getByRole('button', { name: '删除消息' }).className).toContain(
      'hover:text-[var(--theme-text-danger)]',
    );
  });

  it('uses AMC-style user message bubble and action buttons', () => {
    render(
      <ChatMessage
        message={{ id: 'user-1', role: 'user', content: 'hello' }}
        onEditMessage={vi.fn()}
        onDeleteMessage={vi.fn()}
      />,
    );

    const row = screen.getByTestId('message-row');
    const bubble = screen.getByTestId('message-bubble');

    expect(row.className).toContain('justify-end');
    expect(bubble.className).toContain('w-fit');
    expect(bubble.className).toContain('max-w-[80%]');
    expect(bubble.className).toContain('sm:max-w-3xl');
    expect(bubble.className).toContain('lg:max-w-4xl');
    expect(bubble.className).toContain('xl:max-w-5xl');
    expect(bubble.className).toContain('rounded-2xl');
    expect(bubble.className).toContain('rounded-tr-sm');
    expect(screen.queryByText('你')).toBeNull();
    const actions = screen.getByTestId('message-actions');
    expect(within(actions).getByRole('button', { name: '编辑消息' }).className).toContain(
      'rounded-lg',
    );
    expect(within(actions).getByTitle('复制消息').className).toContain('rounded-lg');
    expect(within(actions).getByRole('button', { name: '删除消息' })).toBeTruthy();
  });

  it('opens AMC-style overflow actions for model messages', async () => {
    const user = userEvent.setup();
    const continueGeneration = vi.fn();
    const forkMessage = vi.fn();

    render(
      <ChatMessage
        message={{ id: 'model-1', role: 'model', content: 'answer' }}
        onContinueGeneration={continueGeneration}
        onForkMessage={forkMessage}
      />,
    );

    const moreButton = screen.getByRole('button', { name: '更多操作' });
    expect(moreButton.getAttribute('aria-expanded')).toBe('false');

    await user.click(moreButton);

    expect(moreButton.getAttribute('aria-expanded')).toBe('true');
    const menu = screen.getByRole('menu');
    expect(menu.className).toContain('absolute');
    expect(menu.className).toContain('left-full');

    await user.click(screen.getByRole('menuitem', { name: '从此分支' }));

    expect(forkMessage).toHaveBeenCalledWith('model-1');
  });

  it('uses an AMC-style collapsed thought panel for model thinking data', async () => {
    const user = userEvent.setup();

    render(
      <ChatMessage
        message={{
          id: 'model-thinking',
          role: 'model',
          content: 'answer',
          totalDuration: 1500,
          analysis: {
            thought_process: '先拆解问题，再并行验证。',
            experts: [
              {
                role: '架构专家',
                description: '检查结构',
                temperature: 0.2,
                prompt: 'review architecture',
              },
            ],
          },
          experts: [
            {
              id: 'expert-1',
              role: '架构专家',
              description: '检查结构',
              temperature: 0.2,
              prompt: 'review architecture',
              status: 'completed',
              content: '结构可行',
              thoughts: '检查依赖边界。',
            },
          ],
        }}
      />,
    );

    const toggle = screen.getByRole('button', { name: /已思考 1\.5 秒/ });
    const accordion = screen.getByTestId('thinking-process-accordion');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.className).toContain('rounded-xl');
    expect(toggle.className).toContain('bg-[var(--theme-bg-tertiary)]/20');
    expect(accordion.className).toContain('thought-process-accordion');
    expect(accordion.className).not.toContain('expanded');

    await user.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(accordion.className).toContain('expanded');
    expect(screen.getByTestId('process-flow')).toBeTruthy();
  });

  it('renders streaming model content through the Markdown renderer', async () => {
    const { container } = render(
      <ChatMessage
        message={{
          id: 'streaming-model',
          role: 'model',
          isThinking: true,
          content: '| 项目 | 状态 |\n| --- | --- |\n| **Markdown** | streaming |',
        }}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('.markdown-body.is-loading')).toBeTruthy();
    });
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByText('Markdown').tagName.toLowerCase()).toBe('strong');
    expect(container.querySelector('pre.whitespace-pre-wrap')).toBeNull();
  });

  it('does not expose text edit actions for model messages', () => {
    render(
      <ChatMessage
        message={{ id: 'model-1', role: 'model', content: 'answer' }}
        onEditMessage={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: '编辑消息' })).toBeNull();
  });

  it('does not expose text edit actions for attachment-only user messages', () => {
    render(
      <ChatMessage
        message={{
          id: 'user-1',
          role: 'user',
          content: '',
          attachments: [
            {
              id: 'att-1',
              type: 'image',
              name: 'diagram.png',
              mimeType: 'image/png',
              data: 'ZmFrZQ==',
            },
          ],
        }}
        onEditMessage={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: '编辑消息' })).toBeNull();
    expect(screen.getByAltText('attachment')).toBeTruthy();
  });

  it('does not show copied state when clipboard write fails', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('clipboard blocked'));

    render(<ChatMessage message={{ id: 'model-1', role: 'model', content: 'answer' }} />);

    await user.click(screen.getByTitle('复制消息'));

    expect(screen.queryByText('已复制')).toBeNull();
  });
});
