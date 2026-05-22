import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ChatMessage from '../components/ChatMessage';

describe('ChatMessage', () => {
  it('does not show copied state when clipboard write fails', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('clipboard blocked'));

    render(<ChatMessage message={{ id: 'model-1', role: 'model', content: 'answer' }} />);

    await user.click(screen.getByTitle('复制消息'));

    expect(screen.queryByText('已复制')).toBeNull();
  });
});
