import { Box, Layers3, Sparkles } from 'lucide-react';
import type { ModelCatalogItem } from '@/types';

const MODEL_ICON_SIZE = 18;

export const getModelIcon = (model: ModelCatalogItem | undefined) => {
  if (!model) {
    return (
      <Box
        size={MODEL_ICON_SIZE}
        className="flex-shrink-0 text-[var(--theme-text-tertiary)]"
        strokeWidth={1.5}
      />
    );
  }

  const normalizedId = model.value.toLowerCase();

  if (model.provider === 'google' || normalizedId.includes('gemini')) {
    return (
      <Sparkles
        size={MODEL_ICON_SIZE}
        className="flex-shrink-0 text-sky-500 dark:text-sky-400"
        strokeWidth={1.5}
      />
    );
  }

  if (
    normalizedId.includes('glm') ||
    normalizedId.includes('qwen') ||
    normalizedId.includes('deepseek')
  ) {
    return (
      <Layers3
        size={MODEL_ICON_SIZE}
        className="flex-shrink-0 text-violet-500 dark:text-violet-400"
        strokeWidth={1.5}
      />
    );
  }

  return (
    <Box
      size={MODEL_ICON_SIZE}
      className="flex-shrink-0 text-[var(--theme-text-tertiary)] opacity-70"
      strokeWidth={1.5}
    />
  );
};
