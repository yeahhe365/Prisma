import { describe, expect, it } from 'vitest';

import { resolveAppVersion } from '@/appVersion';

describe('app version', () => {
  it('uses the injected package version when available', () => {
    expect(resolveAppVersion('0.1.0')).toBe('0.1.0');
  });

  it('shows a development fallback when version injection is missing', () => {
    expect(resolveAppVersion()).toBe('0.0.0-dev');
  });
});
