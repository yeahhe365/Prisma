// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../config';
import SettingsModal from '../components/settings/SettingsModal';

describe('SettingsModal', () => {
  const renderModal = () =>
    render(
      <SettingsModal
        isOpen
        onClose={vi.fn()}
        config={DEFAULT_CONFIG}
        setConfig={vi.fn()}
        effectiveConfig={DEFAULT_CONFIG}
        model="gemini-3-flash-preview"
        onSetThinkingLevel={vi.fn()}
        onSetRecursiveLoop={vi.fn()}
      />,
    );

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ stargazers_count: 1234 }),
        }),
      ),
    );
  });

  it('uses a JustSearch-style sidebar tab layout for settings sections', async () => {
    const user = userEvent.setup();

    renderModal();

    const dialog = screen.getByRole('dialog', { name: '设置' });
    const tablist = screen.getByRole('tablist', { name: '设置分类' });
    const modelTab = screen.getByRole('tab', { name: '模型管理' });
    const thinkingTab = screen.getByRole('tab', { name: '推理设置' });
    const aboutTab = screen.getByRole('tab', { name: '关于' });

    expect(dialog.contains(tablist)).toBe(true);
    expect(modelTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: '模型管理' }).textContent).toContain('已添加模型');

    await user.click(thinkingTab);

    expect(thinkingTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: '推理设置' }).textContent).toContain('递归优化');

    await user.click(aboutTab);

    expect(aboutTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: '关于' }).textContent).toContain(
      'yeahhe365 / Prisma',
    );
  });
});
