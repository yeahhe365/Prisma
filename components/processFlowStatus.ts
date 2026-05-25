import type { AppState, ExpertResult } from '@/types';

export type ProcessNodeStatus = 'idle' | 'active' | 'completed';

export const getManagerStatus = (
  appState: AppState,
  hasManagerAnalysis: boolean,
): ProcessNodeStatus => {
  if (hasManagerAnalysis) return 'completed';
  if (appState === 'analyzing') return 'active';
  return 'idle';
};

export const getExpertsStatus = (experts: ExpertResult[]): ProcessNodeStatus => {
  if (experts.some((expert) => expert.status === 'thinking' || expert.status === 'pending')) {
    return 'active';
  }

  if (
    experts.length > 0 &&
    experts.every((expert) => expert.status === 'completed' || expert.status === 'error')
  ) {
    return 'completed';
  }

  return 'idle';
};

export const getSynthesisStatus = (appState: AppState): ProcessNodeStatus => {
  if (appState === 'synthesizing') return 'active';
  if (appState === 'completed') return 'completed';
  return 'idle';
};
