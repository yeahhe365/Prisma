// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG, DEFAULT_MODEL } from '../config';
import Header from '../components/Header';

describe('Header', () => {
  it('keeps model controls shrinkable on narrow screens', () => {
    const { container } = render(
      <Header
        selectedModel={DEFAULT_MODEL}
        setSelectedModel={vi.fn()}
        onOpenSettings={vi.fn()}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        config={DEFAULT_CONFIG}
        isDark={false}
        onToggleDark={vi.fn()}
      />,
    );

    const title = screen.getByText('Prisma');
    const select = container.querySelector('select');

    expect(title.className).toContain('hidden');
    expect(select?.parentElement?.className).toContain('min-w-0');
    expect(select?.className).toContain('max-w-[32vw]');
  });
});
