// @vitest-environment jsdom

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../config';
import SettingsModal from '../components/settings/SettingsModal';

describe('SettingsModal', () => {
  const fetchMock = vi.fn();

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
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/releases/latest')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tag_name: '0.0.0' }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ stargazers_count: 1234 }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
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
      '在 GitHub 上查看',
    );
  });

  it('uses AMC-style theme surfaces and tab states', () => {
    renderModal();

    const dialog = screen.getByRole('dialog', { name: '设置' });
    const modelTab = screen.getByRole('tab', { name: '模型管理' });
    const tablist = screen.getByRole('tablist', { name: '设置分类' });

    expect(dialog.className).toContain('bg-[var(--theme-bg-primary)]');
    expect(dialog.className).toContain('border-[var(--theme-border-primary)]');
    expect(tablist.parentElement?.className).toContain('bg-[var(--theme-bg-secondary)]');
    expect(modelTab.className).toContain('bg-[var(--theme-bg-tertiary)]');
    expect(modelTab.className).toContain('text-[var(--theme-text-primary)]');
  });

  it('does not render a bottom completion button', () => {
    renderModal();

    expect(screen.queryByRole('button', { name: '完成' })).toBeNull();
  });

  it('does not show a standalone settings title in the sidebar header', () => {
    renderModal();

    expect(screen.queryByText('设置', { selector: 'span, div' })).toBeNull();
  });

  it('does not show English kicker labels above settings panel titles', async () => {
    const user = userEvent.setup();

    renderModal();

    expect(screen.queryByText('Connection')).toBeNull();

    await user.click(screen.getByRole('tab', { name: '推理设置' }));
    expect(screen.queryByText('Reasoning')).toBeNull();

    await user.click(screen.getByRole('tab', { name: '关于' }));
    expect(screen.queryByText('Project')).toBeNull();
  });

  it('renders the about panel in an AMC-style centered presentation', async () => {
    const user = userEvent.setup();

    renderModal();

    await user.click(screen.getByRole('tab', { name: '关于' }));

    const aboutSection = screen.getByTestId('settings-about-section');
    const logo = screen.getByLabelText('Prisma 标志');
    const releaseLink = screen.getByRole('link', { name: /v0\.0\.0/ });
    const githubLink = screen.getByRole('link', { name: '在 GitHub 上查看' });
    const starsLink = screen.getByRole('link', { name: /星标/ });

    expect(aboutSection.className).toContain('items-center');
    expect(aboutSection.className).toContain('text-center');
    expect(aboutSection.className).toContain('animate-in');
    expect(logo.getAttribute('class')).toContain('drop-shadow-2xl');
    expect(releaseLink.className).toContain('rounded-full');
    expect(releaseLink.className).toContain('p-[1px]');
    expect(githubLink.getAttribute('href')).toBe('https://github.com/yeahhe365/Prisma');
    expect(githubLink.className).toContain('bg-[#24292F]');
    expect(starsLink.getAttribute('href')).toBe('https://github.com/yeahhe365/Prisma/stargazers');
    expect(screen.queryByText('yeahhe365 / Prisma')).toBeNull();

    await waitFor(() => {
      expect(starsLink.textContent).toContain('1,234');
    });
  });

  it('localizes the release status when a newer Prisma release is available', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/releases/latest')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tag_name: '0.0.1' }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ stargazers_count: 7 }),
      });
    });

    renderModal();

    await user.click(screen.getByRole('tab', { name: '关于' }));

    const releaseLink = screen.getByRole('link', { name: /v0\.0\.0/ });

    await waitFor(() => {
      expect(releaseLink.textContent).toContain('有新版本');
      expect(releaseLink.getAttribute('title')).toBe('有新版本：0.0.1');
    });
  });
});
