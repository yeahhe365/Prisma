import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDeepThinkState } from '@/hooks/useDeepThinkState';
import type { ExpertResult } from '@/types';

const initialExpert: ExpertResult = {
  id: 'expert-1',
  role: 'Planner',
  description: 'Handles planning',
  temperature: 0.3,
  prompt: 'plan',
  status: 'pending',
  round: 1,
};

describe('useDeepThinkState', () => {
  it('updates and appends experts while keeping the ref in sync', () => {
    const { result } = renderHook(() => useDeepThinkState());

    act(() => {
      result.current.setInitialExperts([initialExpert]);
      result.current.updateExpertAt(0, { status: 'thinking', content: 'draft' });
      result.current.appendExperts([
        {
          ...initialExpert,
          id: 'expert-2',
          role: 'Reviewer',
        },
      ]);
    });

    expect(result.current.experts).toHaveLength(2);
    expect(result.current.experts[0]).toMatchObject({ status: 'thinking', content: 'draft' });
    expect(result.current.expertsDataRef.current[1]).toMatchObject({
      id: 'expert-2',
      role: 'Reviewer',
    });
  });

  it('stops active work and records an end time', () => {
    const { result } = renderHook(() => useDeepThinkState());
    const controller = new AbortController();

    act(() => {
      result.current.abortControllerRef.current = controller;
      result.current.setAppState('experts_working');
      result.current.stopDeepThink();
    });

    expect(controller.signal.aborted).toBe(true);
    expect(result.current.abortControllerRef.current).toBeNull();
    expect(result.current.appState).toBe('idle');
    expect(result.current.processEndTime).not.toBeNull();
  });

  it('can stop cleanly even when there is no active abort controller', () => {
    const { result } = renderHook(() => useDeepThinkState());

    act(() => {
      result.current.setAppState('reviewing');
      result.current.stopDeepThink();
    });

    expect(result.current.appState).toBe('idle');
    expect(result.current.processEndTime).not.toBeNull();
  });

  it('resets all orchestration state back to idle', () => {
    const { result } = renderHook(() => useDeepThinkState());

    act(() => {
      result.current.setAppState('completed');
      result.current.setManagerAnalysis({ thought_process: 'done', experts: [] });
      result.current.setInitialExperts([initialExpert]);
      result.current.setFinalOutput('final');
      result.current.setSynthesisThoughts('thoughts');
      result.current.setProcessStartTime(1);
      result.current.setProcessEndTime(2);
      result.current.resetDeepThink();
    });

    expect(result.current.appState).toBe('idle');
    expect(result.current.managerAnalysis).toBeNull();
    expect(result.current.experts).toEqual([]);
    expect(result.current.finalOutput).toBe('');
    expect(result.current.synthesisThoughts).toBe('');
    expect(result.current.processStartTime).toBeNull();
    expect(result.current.processEndTime).toBeNull();
  });
});
