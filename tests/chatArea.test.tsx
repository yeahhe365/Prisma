import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatMessage } from '@/types';

const chatMessageMock = vi.hoisted(() =>
  vi.fn(({ message, prevMessage }: { message: ChatMessage; prevMessage?: ChatMessage }) => (
    <div
      data-testid="chat-message"
      data-message-id={message.id}
      data-prev-id={prevMessage?.id ?? ''}
    />
  )),
);

vi.mock('@/components/ChatMessage', () => ({
  default: chatMessageMock,
}));

import ChatArea from '@/components/ChatArea';

const baseProps = {
  appState: 'idle' as const,
  managerAnalysis: null,
  experts: [],
  finalOutput: '',
  processStartTime: null,
  processEndTime: null,
};

describe('ChatArea', () => {
  beforeEach(() => {
    chatMessageMock.mockClear();
  });

  it('passes previous messages and AMC-style action callbacks to message rows', () => {
    const messages: ChatMessage[] = [
      { id: 'user-1', role: 'user', content: 'hello' },
      { id: 'model-1', role: 'model', content: 'answer' },
    ];
    const onEditMessage = vi.fn();
    const onDeleteMessage = vi.fn();
    const onRetryMessage = vi.fn();
    const onContinueGeneration = vi.fn();
    const onForkMessage = vi.fn();

    render(
      <ChatArea
        {...baseProps}
        messages={messages}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
        onRetryMessage={onRetryMessage}
        onContinueGeneration={onContinueGeneration}
        onForkMessage={onForkMessage}
      />,
    );

    const renderedMessages = screen.getAllByTestId('chat-message');
    expect(renderedMessages).toHaveLength(2);
    expect(renderedMessages[0].getAttribute('data-prev-id')).toBe('');
    expect(renderedMessages[1].getAttribute('data-prev-id')).toBe('user-1');
    expect(chatMessageMock.mock.calls[1][0]).toMatchObject({
      message: messages[1],
      prevMessage: messages[0],
      onEditMessage,
      onDeleteMessage,
      onRetryMessage,
      onContinueGeneration,
      onForkMessage,
    });
  });

  it('renders the active generation through the same AMC-style message row', () => {
    const messages: ChatMessage[] = [{ id: 'user-1', role: 'user', content: 'hello' }];
    const managerAnalysis = { thought_process: 'plan', experts: [] };
    const experts = [
      {
        id: 'expert-1',
        role: 'Reviewer',
        description: 'Checks detail',
        temperature: 0.2,
        prompt: 'Review',
        status: 'thinking' as const,
      },
    ];

    render(
      <ChatArea
        {...baseProps}
        messages={messages}
        appState="experts_working"
        managerAnalysis={managerAnalysis}
        experts={experts}
        finalOutput="partial answer"
      />,
    );

    const renderedMessages = screen.getAllByTestId('chat-message');
    expect(renderedMessages).toHaveLength(2);
    expect(renderedMessages[1].getAttribute('data-message-id')).toBe('streaming');
    expect(renderedMessages[1].getAttribute('data-prev-id')).toBe('user-1');
    expect(chatMessageMock.mock.calls[1][0]).toMatchObject({
      message: {
        id: 'streaming',
        role: 'model',
        content: 'partial answer',
        isThinking: true,
        analysis: managerAnalysis,
        experts,
      },
      prevMessage: messages[0],
    });
  });
});
