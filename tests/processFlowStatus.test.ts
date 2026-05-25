import { describe, expect, it } from 'vitest';

import {
  getExpertsStatus,
  getManagerStatus,
  getSynthesisStatus,
} from '@/components/processFlowStatus';
import type { ExpertResult } from '@/types';

const expert = (status: ExpertResult['status']): ExpertResult => ({
  id: `expert-${status}`,
  role: status,
  description: status,
  temperature: 0.2,
  prompt: status,
  status,
});

describe('process flow status helpers', () => {
  it('derives manager status from app state and analysis availability', () => {
    expect(getManagerStatus('analyzing', false)).toBe('active');
    expect(getManagerStatus('experts_working', true)).toBe('completed');
    expect(getManagerStatus('idle', false)).toBe('idle');
  });

  it('derives expert status from expert progress', () => {
    expect(getExpertsStatus([])).toBe('idle');
    expect(getExpertsStatus([expert('pending')])).toBe('active');
    expect(getExpertsStatus([expert('thinking')])).toBe('active');
    expect(getExpertsStatus([expert('completed'), expert('error')])).toBe('completed');
  });

  it('derives synthesis status from app state', () => {
    expect(getSynthesisStatus('synthesizing')).toBe('active');
    expect(getSynthesisStatus('completed')).toBe('completed');
    expect(getSynthesisStatus('experts_working')).toBe('idle');
  });
});
