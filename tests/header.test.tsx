// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '@/config';
import Header from '@/components/Header';
import type { AppConfig } from '@/types';

const configWithGeminiModel: AppConfig = {
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

const configWithGeminiModels: AppConfig = {
  ...DEFAULT_CONFIG,
  customModels: [
    {
      id: 'custom-gemini-flash',
      name: 'gemini-3.5-flash',
      displayName: 'Gemini 3.5 Flash',
      provider: 'google',
    },
    {
      id: 'custom-gemini-pro',
      name: 'gemini-3.1-pro-preview',
      displayName: 'Gemini 3.1 Pro Preview',
      provider: 'google',
    },
  ],
};

const configWithGeminiAndOpenAIModels: AppConfig = {
  ...DEFAULT_CONFIG,
  customModels: [
    ...(configWithGeminiModel.customModels || []),
    {
      id: 'custom-glm-5-turbo',
      name: 'glm-5-turbo',
      displayName: 'GLM-5 Turbo',
      provider: 'openai',
    },
  ],
};

describe('Header', () => {
  it('keeps the AMC-style model selector shrinkable without rendering a desktop brand block', () => {
    const { container } = render(
      <Header
        selectedModel="gemini-3.5-flash"
        setSelectedModel={vi.fn()}
        onOpenSettings={vi.fn()}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        config={configWithGeminiModel}
        isDark={false}
        onToggleDark={vi.fn()}
      />,
    );

    const modelButton = screen.getByRole('button', { name: /当前模型：Gemini 3.5 Flash/ });
    const sidebarButton = screen.getByTitle('切换历史记录');

    expect(screen.queryByText('Prisma')).toBeNull();
    expect(container.querySelector('select')).toBeNull();
    expect(modelButton.parentElement?.parentElement?.className).toContain('min-w-0');
    expect(screen.getByTestId('header-model-selector-label').className).toContain('max-w-[180px]');
    expect(screen.getByTestId('header-model-selector-label').textContent).toBe('3.5 Flash');
    expect(sidebarButton.className).toContain('md:hidden');
  });

  it('uses AMC-style theme surfaces and compact icon controls', () => {
    const { container } = render(
      <Header
        selectedModel="gemini-3.5-flash"
        setSelectedModel={vi.fn()}
        onOpenSettings={vi.fn()}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        config={configWithGeminiModel}
        isDark={false}
        onToggleDark={vi.fn()}
      />,
    );

    const header = container.querySelector('header');
    const modelButton = screen.getByRole('button', { name: /当前模型：Gemini 3.5 Flash/ });
    const sidebarButton = screen.getByTitle('切换历史记录');
    const settingsButton = screen.getByTitle('设置');

    expect(header?.className).toContain('bg-[var(--theme-bg-primary)]');
    expect(header?.className).toContain('relative');
    expect(header?.className).toContain('z-20');
    expect(header?.className).toContain('flex-shrink-0');
    expect(header?.className).not.toContain('sticky');
    expect(header?.className).not.toContain('border-b');
    expect(modelButton.className).toContain('bg-transparent');
    expect(modelButton.className).toContain('hover:bg-[var(--theme-bg-tertiary)]');
    expect(modelButton.getAttribute('aria-haspopup')).toBe('listbox');
    expect(sidebarButton.className).toContain('h-9');
    expect(sidebarButton.className).toContain('rounded-xl');
    expect(settingsButton.className).toContain('text-[var(--theme-icon-settings)]');
  });

  it('opens a grouped model listbox from user-created Gemini models only', async () => {
    const user = userEvent.setup();
    const setSelectedModel = vi.fn();

    render(
      <Header
        selectedModel="gemini-3.5-flash"
        setSelectedModel={setSelectedModel}
        onOpenSettings={vi.fn()}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        config={configWithGeminiModel}
        isDark={false}
        onToggleDark={vi.fn()}
      />,
    );

    const modelButton = screen.getByRole('button', { name: /当前模型：Gemini 3.5 Flash/ });

    await user.click(modelButton);

    const listbox = screen.getByRole('listbox');
    const selectedOption = screen.getByRole('option', { name: /Gemini 3.5 Flash/ });

    expect(modelButton.getAttribute('aria-expanded')).toBe('true');
    expect(listbox.textContent).toContain('Gemini');
    expect(listbox.textContent).not.toContain('OpenAI 兼容');
    expect(screen.queryByRole('option', { name: /GLM-5 Turbo/ })).toBeNull();
    expect(selectedOption.getAttribute('aria-selected')).toBe('true');
    expect(selectedOption.querySelector('.lucide-check')).toBeTruthy();
  });

  it('opens settings from the model trigger when no models exist', async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();

    render(
      <Header
        selectedModel={null}
        setSelectedModel={vi.fn()}
        onOpenSettings={onOpenSettings}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        config={DEFAULT_CONFIG}
        isDark={false}
        onToggleDark={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '未配置模型。打开模型设置' }));

    expect(screen.getByTestId('header-model-selector-label').textContent).toBe('未配置模型');
    expect(onOpenSettings).toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows OpenAI-compatible custom models after the user configures them', async () => {
    const user = userEvent.setup();
    const setSelectedModel = vi.fn();

    render(
      <Header
        selectedModel="gemini-3.5-flash"
        setSelectedModel={setSelectedModel}
        onOpenSettings={vi.fn()}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        config={configWithGeminiAndOpenAIModels}
        isDark={false}
        onToggleDark={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /当前模型：Gemini 3.5 Flash/ }));

    const listbox = screen.getByRole('listbox');
    const customOption = screen.getByRole('option', {
      name: /^GLM-5 Turbo glm-5-turbo$/,
    });

    expect(listbox.textContent).toContain('OpenAI 兼容');
    expect(customOption.querySelector('.lucide-layers')).toBeTruthy();

    await user.click(customOption);

    expect(setSelectedModel).toHaveBeenCalledWith('glm-5-turbo');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports AMC-style keyboard selection in the model picker', async () => {
    const user = userEvent.setup();
    const setSelectedModel = vi.fn();

    render(
      <Header
        selectedModel="gemini-3.5-flash"
        setSelectedModel={setSelectedModel}
        onOpenSettings={vi.fn()}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        config={configWithGeminiModels}
        isDark={false}
        onToggleDark={vi.fn()}
      />,
    );

    const modelButton = screen.getByRole('button', { name: /当前模型：Gemini 3.5 Flash/ });
    modelButton.focus();

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(setSelectedModel).toHaveBeenCalledWith('gemini-3.1-pro-preview');
  });
});
