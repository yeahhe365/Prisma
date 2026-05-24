// @vitest-environment jsdom

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../config';
import SettingsModal from '../components/settings/SettingsModal';
import type { AppConfig } from '../types';

describe('SettingsModal', () => {
  const fetchMock = vi.fn();
  const configuredModelConfig: AppConfig = {
    ...DEFAULT_CONFIG,
    customModels: [
      {
        id: 'custom-gemini-flash',
        name: 'gemini-3.5-flash',
        displayName: 'Gemini 3.5 Flash',
        provider: 'google',
      },
    ],
  };

  const renderModal = () =>
    render(
      <SettingsModal
        isOpen
        onClose={vi.fn()}
        config={configuredModelConfig}
        setConfig={vi.fn()}
        effectiveConfig={configuredModelConfig}
        model="gemini-3.5-flash"
        onSetThinkingLevel={vi.fn()}
        onSetRecursiveLoop={vi.fn()}
      />,
    );

  const renderStatefulModal = (initialConfig: AppConfig = DEFAULT_CONFIG) => {
    let latestConfig = initialConfig;

    const StatefulSettings = () => {
      const [config, setConfig] = React.useState(initialConfig);
      latestConfig = config;

      return (
        <SettingsModal
          isOpen
          onClose={vi.fn()}
          config={config}
          setConfig={setConfig}
          effectiveConfig={config}
          model={config.customModels?.[0]?.name || null}
          onSetThinkingLevel={vi.fn()}
          onSetRecursiveLoop={vi.fn()}
        />
      );
    };

    return {
      ...render(<StatefulSettings />),
      getLatestConfig: () => latestConfig,
    };
  };

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/releases/latest')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tag_name: '0.1.0' }),
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

  it('renders model configuration with an AMC-style model list and compact editor', () => {
    renderModal();

    const modelList = screen.getByTestId('settings-model-list-container');
    const addButton = screen.getByRole('button', { name: '添加' });

    expect(screen.getByText('管理模型')).toBeTruthy();
    expect(screen.queryByText('全部')).toBeNull();
    expect(modelList.className).toContain('bg-[var(--theme-bg-input)]/30');
    expect(modelList.textContent).toContain('已添加模型');
    expect(modelList.textContent).toContain('当前');
    expect(addButton.className).toContain('text-[var(--theme-text-link)]');
    expect(screen.getByText('API 配置')).toBeTruthy();
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

  it('adds Gemini API models with AMC-style controls', async () => {
    const user = userEvent.setup();
    const { getLatestConfig } = renderStatefulModal();

    const modeGroup = screen.getByRole('group', { name: 'API 模式' });
    const apiConfig = modeGroup.parentElement?.parentElement as HTMLElement;
    const geminiButton = within(modeGroup).getByRole('button', { name: 'Gemini' });
    const apiKeyInput = within(apiConfig).getByLabelText('API Key（选填）');
    const baseUrlInput = within(apiConfig).getByLabelText('Base URL（选填）');

    expect(modeGroup.textContent).toContain('Gemini');
    expect(modeGroup.textContent).toContain('OpenAI 兼容');

    await user.click(geminiButton);
    await user.type(screen.getByLabelText('Model ID'), 'gemini-2.5-flash');
    await user.type(screen.getByLabelText('显示名称'), 'Gemini Flash');
    await user.type(apiKeyInput, 'gemini-key');
    await user.type(baseUrlInput, 'https://gateway.example.com/v1beta');
    await user.click(screen.getByRole('button', { name: '添加模型' }));

    await waitFor(() => {
      expect(getLatestConfig().customModels).toContainEqual(
        expect.objectContaining({
          name: 'gemini-2.5-flash',
          displayName: 'Gemini Flash',
          provider: 'google',
          apiKey: 'gemini-key',
          baseUrl: 'https://gateway.example.com/v1beta',
        }),
      );
    });
  });

  it('adds custom models from the redesigned model configuration panel', async () => {
    const user = userEvent.setup();
    const { getLatestConfig } = renderStatefulModal();

    await user.click(screen.getByRole('button', { name: '添加' }));

    const modeGroup = screen.getByRole('group', { name: 'API 模式' });
    const apiConfig = modeGroup.parentElement?.parentElement as HTMLElement;

    await user.type(screen.getByLabelText('Model ID'), 'qwen-plus');
    await user.type(screen.getByLabelText('显示名称'), 'Qwen Plus');
    await user.type(within(apiConfig).getByLabelText('API Key（选填）'), 'sk-qwen');
    await user.type(
      within(apiConfig).getByLabelText('Base URL（选填）'),
      'https://dashscope.example.com/v1',
    );
    await user.click(screen.getByRole('button', { name: '添加模型' }));

    await waitFor(() => {
      expect(getLatestConfig().customModels).toContainEqual(
        expect.objectContaining({
          name: 'qwen-plus',
          displayName: 'Qwen Plus',
          provider: 'openai',
          apiKey: 'sk-qwen',
          baseUrl: 'https://dashscope.example.com/v1',
        }),
      );
    });
  });

  it('keeps duplicate model id validation inside the redesigned model panel', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { getLatestConfig } = renderStatefulModal({
      ...DEFAULT_CONFIG,
      customModels: [
        {
          id: 'custom-qwen',
          name: 'qwen-plus',
          displayName: 'Qwen Plus',
          provider: 'openai',
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: '添加' }));
    await user.type(screen.getByLabelText('Model ID'), 'qwen-plus');
    await user.click(screen.getByRole('button', { name: '添加模型' }));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Model ID "qwen-plus" 已存在。');
    expect(getLatestConfig().customModels).toHaveLength(1);
  });

  it('deletes user-created models from the redesigned model panel', async () => {
    const user = userEvent.setup();
    const { getLatestConfig } = renderStatefulModal({
      ...DEFAULT_CONFIG,
      customModels: [
        {
          id: 'custom-gemini-3.5-flash',
          name: 'gemini-3.5-flash',
          displayName: 'Gemini 3.5 Flash',
          provider: 'google',
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: /Gemini 3.5 Flash/ }));
    await user.click(screen.getByRole('button', { name: '删除' }));

    await waitFor(() => {
      expect(getLatestConfig().customModels).toEqual([]);
    });
  });

  it('renders the about panel in an AMC-style centered presentation', async () => {
    const user = userEvent.setup();

    renderModal();

    await user.click(screen.getByRole('tab', { name: '关于' }));

    const aboutSection = screen.getByTestId('settings-about-section');
    const logo = screen.getByLabelText('Prisma 标志');
    const releaseLink = screen.getByRole('link', { name: /v0\.1\.0/ });
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
          json: () => Promise.resolve({ tag_name: '0.1.1' }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ stargazers_count: 7 }),
      });
    });

    renderModal();

    await user.click(screen.getByRole('tab', { name: '关于' }));

    const releaseLink = screen.getByRole('link', { name: /v0\.1\.0/ });

    await waitFor(() => {
      expect(releaseLink.textContent).toContain('有新版本');
      expect(releaseLink.getAttribute('title')).toBe('有新版本：0.1.1');
    });
  });
});
