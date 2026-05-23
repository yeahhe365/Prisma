// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG, DEFAULT_MODEL } from '../config';
import Header from '../components/Header';

describe('Header', () => {
  it('keeps the AMC-style model selector shrinkable without rendering a desktop brand block', () => {
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

    const select = container.querySelector('select');
    const sidebarButton = screen.getByTitle('切换历史记录');

    expect(screen.queryByText('Prisma')).toBeNull();
    expect(select?.parentElement?.className).toContain('min-w-0');
    expect(select?.className).toContain('max-w-[180px]');
    expect(sidebarButton.className).toContain('md:hidden');
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

    expect(header?.className).toContain('bg-[var(--theme-bg-primary)]');
    expect(header?.className).toContain('relative');
    expect(header?.className).toContain('z-20');
    expect(header?.className).toContain('flex-shrink-0');
    expect(header?.className).not.toContain('sticky');
    expect(header?.className).not.toContain('border-b');
    expect(select?.className).toContain('bg-transparent');
    expect(select?.className).toContain('hover:bg-[var(--theme-bg-tertiary)]');
    expect(sidebarButton.className).toContain('h-9');
    expect(sidebarButton.className).toContain('rounded-xl');
    expect(settingsButton.className).toContain('text-[var(--theme-icon-settings)]');
  });
});
