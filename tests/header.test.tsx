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

  it('uses AMC-style theme surfaces and compact icon controls', () => {
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

    const header = container.querySelector('header');
    const select = container.querySelector('select');
    const sidebarButton = screen.getByTitle('切换历史记录');
    const settingsButton = screen.getByTitle('设置');

    expect(header?.className).toContain('bg-[var(--theme-bg-secondary)]');
    expect(header?.className).toContain('border-[var(--theme-border-primary)]');
    expect(select?.className).toContain('bg-transparent');
    expect(select?.className).toContain('hover:bg-[var(--theme-bg-tertiary)]');
    expect(sidebarButton.className).toContain('h-9');
    expect(sidebarButton.className).toContain('rounded-xl');
    expect(settingsButton.className).toContain('text-[var(--theme-icon-settings)]');
  });
});
