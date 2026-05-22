import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AddModelForm from '../components/settings/AddModelForm';
import type { CustomModel } from '../types';

const existingModels: CustomModel[] = [
  {
    id: 'custom-existing',
    name: 'existing-model',
    displayName: 'Existing Model',
    provider: 'openai',
  },
];

describe('AddModelForm', () => {
  it('shows an inline error instead of alerting when the model id already exists', async () => {
    const user = userEvent.setup();
    const onAddModel = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<AddModelForm existingModels={existingModels} onAddModel={onAddModel} />);

    await user.type(screen.getByPlaceholderText('例如：llama-3-8b-instruct'), 'existing-model');
    await user.click(screen.getByRole('button', { name: '添加模型' }));

    expect(onAddModel).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Model ID "existing-model" 已存在。');
  });
});
