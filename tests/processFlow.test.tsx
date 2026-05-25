import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import ExpertCard from '@/components/ExpertCard';
import ProcessFlow from '@/components/ProcessFlow';
import type { AnalysisResult, ExpertResult } from '@/types';

const managerAnalysis: AnalysisResult = {
  thought_process: '先拆解问题，再让不同专家并行验证。',
  experts: [
    {
      role: '架构专家',
      description: '检查整体结构',
      temperature: 0.2,
      prompt: 'review architecture',
    },
    {
      role: '交互专家',
      description: '检查交互体验',
      temperature: 0.4,
      prompt: 'review interaction',
    },
  ],
};

const expert = (overrides: Partial<ExpertResult>): ExpertResult => ({
  id: 'expert-1',
  role: '架构专家',
  description: '检查整体结构',
  temperature: 0.2,
  prompt: 'review architecture',
  status: 'completed',
  content: '结构建议',
  thoughts: '结构推理',
  ...overrides,
});

describe('ProcessFlow', () => {
  it('shows a compact process summary and expert progress', () => {
    render(
      <ProcessFlow
        appState="experts_working"
        managerAnalysis={managerAnalysis}
        experts={[
          expert({ id: 'expert-1', status: 'thinking', role: '架构专家' }),
          expert({ id: 'expert-2', status: 'completed', role: '交互专家' }),
        ]}
      />,
    );

    expect(screen.getByTestId('process-flow')).toBeTruthy();
    expect(screen.getByText('推理过程')).toBeTruthy();
    expect(screen.getByText('专家执行中')).toBeTruthy();
    expect(screen.getByText('规划已就绪')).toBeTruthy();
    expect(screen.getAllByText('2 位专家 · 1 进行中 · 1 完成').length).toBeGreaterThan(0);
    expect(screen.getByText('正在处理：架构专家')).toBeTruthy();
    expect(screen.getAllByTestId('expert-card')).toHaveLength(2);

    const expertSection = screen.getByRole('button', { name: /专家执行/ });
    expect(expertSection.getAttribute('aria-expanded')).toBe('true');
    expect(within(screen.getByTestId('process-flow')).getByText('综合')).toBeTruthy();
  });

  it('lets each process section collapse independently', async () => {
    const user = userEvent.setup();

    render(
      <ProcessFlow
        appState="experts_working"
        managerAnalysis={managerAnalysis}
        experts={[expert({ id: 'expert-1', status: 'completed' })]}
      />,
    );

    const managerSection = screen.getByRole('button', { name: /规划策略/ });
    const expertSection = screen.getByRole('button', { name: /专家执行/ });

    await user.click(managerSection);

    expect(managerSection.getAttribute('aria-expanded')).toBe('false');
    expect(expertSection.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByText('策略摘要')).toBeNull();
    expect(screen.getAllByText('完成').length).toBeGreaterThan(0);
  });
});

describe('ExpertCard', () => {
  it('switches between output and reasoning views', async () => {
    const user = userEvent.setup();

    render(<ExpertCard expert={expert({ id: 'expert-1' })} />);

    expect(screen.getByText('结构建议')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '推理' }));

    expect(screen.getByText('结构推理')).toBeTruthy();
  });

  it('renders in-progress expert output through streaming markdown', async () => {
    const { container } = render(
      <ExpertCard
        expert={expert({
          id: 'expert-streaming',
          status: 'thinking',
          content: '| 检查项 | 结果 |\n| --- | --- |\n| **渲染** | streaming |',
        })}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('.markdown-body.is-loading')).toBeTruthy();
    });
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByText('渲染').tagName.toLowerCase()).toBe('strong');
    expect(container.querySelector('pre.whitespace-pre-wrap')).toBeNull();
  });
});
