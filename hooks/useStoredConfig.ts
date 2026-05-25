import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CONFIG,
  getEffectiveConfig,
  getInitialSelectedModel,
  normalizeConfig,
  STORAGE_KEYS,
} from '@/config';
import type { AppConfig, ModelOption } from '@/types';

const loadStoredConfig = (): AppConfig => {
  const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!cached) return DEFAULT_CONFIG;

  try {
    return normalizeConfig(JSON.parse(cached));
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const useStoredConfig = () => {
  const [config, setConfig] = useState<AppConfig>(loadStoredConfig);
  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.MODEL);
    return getInitialSelectedModel(cached, config);
  });

  const effectiveConfig = useMemo(
    () => (selectedModel ? getEffectiveConfig(selectedModel, config) : config),
    [selectedModel, config],
  );

  useEffect(() => {
    const nextSelectedModel = getInitialSelectedModel(selectedModel, config);
    if (nextSelectedModel !== selectedModel) {
      setSelectedModel(nextSelectedModel);
    }
  }, [config, selectedModel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(STORAGE_KEYS.MODEL, selectedModel);
    } else {
      localStorage.removeItem(STORAGE_KEYS.MODEL);
    }
  }, [selectedModel]);

  return {
    config,
    setConfig,
    selectedModel,
    setSelectedModel,
    effectiveConfig,
  };
};
