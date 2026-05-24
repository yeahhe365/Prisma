import { describe, expect, it } from 'vitest';

import { formatSynthesisErrorMessage } from '../services/deepThink/orchestrator';

describe('formatSynthesisErrorMessage', () => {
  it('explains Docker proxy allowlist failures instead of blaming API keys', () => {
    const message = formatSynthesisErrorMessage(new Error('403 "Target host not allowed"'));

    expect(message).toContain('Target host not allowed');
    expect(message).toContain('PRISMA_PROXY_ALLOWED_HOSTS');
    expect(message).not.toContain('Please check your API keys');
  });

  it('keeps the generic API key guidance for other synthesis errors', () => {
    const message = formatSynthesisErrorMessage(new Error('401 Unauthorized'));

    expect(message).toContain('401 Unauthorized');
    expect(message).toContain('Please check your API keys');
  });
});
