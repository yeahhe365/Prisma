import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ChatMessage from '../components/ChatMessage';

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

  it('does not show copied state when clipboard write fails', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('clipboard blocked'));

    render(<ChatMessage message={{ id: 'model-1', role: 'model', content: 'answer' }} />);

    await user.click(screen.getByTitle('复制消息'));

    expect(screen.queryByText('已复制')).toBeNull();
  });
});
