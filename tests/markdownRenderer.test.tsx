import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MarkdownRenderer from '../components/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('does not show copied state when copying a code block fails', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('clipboard blocked'));

    render(<MarkdownRenderer content={'```ts\nconst answer = 42;\n```'} />);

    await user.click(screen.getByRole('button', { name: /copy/i }));

    expect(screen.queryByText('Copied!')).toBeNull();
  });
});
