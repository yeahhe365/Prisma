import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { ApiProvider, CustomModel, AIClient } from './types';

// --- Configuration & Types ---

type AIProviderConfig = {
  provider?: ApiProvider;
  apiKey?: string;
  baseUrl?: string;
};

// --- Provider Detection ---

export const isGoogleProvider = (ai: any): boolean => {
  return ai?.models?.generateContent !== undefined;
};

// --- Custom Fetch (per-instance, not global) ---

/**
 * Creates a custom fetch function scoped to a specific base URL.
 * Only handles API version prefix deduplication as a safety net.
 * URL routing is handled by SDK-level options (httpOptions.baseUrl / baseURL).
 */
const createCustomFetch = (baseUrl: string | null): typeof globalThis.fetch => {
  if (!baseUrl) return window.fetch.bind(window);

  const nativeFetch = window.fetch.bind(window);
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString: string;
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else {
      urlString = input.url;
    }

    // Safety: deduplicate API version prefix (e.g., /v1beta/v1beta → /v1beta)
    // Some Google SDK versions may double-append version prefixes when httpOptions.baseUrl includes one
    if (cleanBaseUrl) {
      try {
        const baseHost = new URL(cleanBaseUrl).host;
        if (baseHost && urlString.includes(baseHost)) {
          const url = new URL(urlString);
          const basePath = new URL(cleanBaseUrl).pathname.replace(/\/$/, '');
          const versionPrefix = basePath.match(/\/v\d+(beta|alpha)?$/)?.[0];
          if (versionPrefix && url.pathname.includes(versionPrefix + versionPrefix)) {
            url.pathname = url.pathname.replace(versionPrefix + versionPrefix, versionPrefix);
            return nativeFetch(url.toString(), init);
          }
        }
      } catch { /* ignore URL parse errors */ }
    }

    return nativeFetch(input, init);
  };
};

// --- Helper Functions ---

export const findCustomModel = (modelName: string, customModels?: CustomModel[]): CustomModel | undefined => {
  return customModels?.find(m => m.name === modelName);
};

/**
 * Detect API provider from model name prefix.
 * Fallback when customModelConfig is unavailable.
 */
export const getAIProvider = (model: string): ApiProvider => {
  const openaiPrefixes = [
    'gpt-', 'o1-', 'o3-', 'o4-',
    'deepseek-', 'claude-',
    'grok-', 'mistral-', 'mixtral-',
    'qwen-', 'yi-', 'glm-',
  ];
  if (openaiPrefixes.some(p => model.startsWith(p))) return 'openai';
  if (model === 'custom') return 'openai';
  return 'google';
};

// --- API Client Factory ---

export const getAI = (config?: AIProviderConfig): any => {
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env?.VITE_API_KEY;
  const baseUrl = config?.baseUrl || null;
  const customFetch = createCustomFetch(baseUrl);

  // Handle OpenAI-compatible providers
  if (provider === 'openai') {
    const options: any = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      fetch: customFetch,
      baseURL: baseUrl || 'https://api.openai.com/v1',
    };

    return new OpenAI(options);
  }

  // Handle Google — use httpOptions.baseUrl for custom endpoint support
  else {
    const options: any = {
      apiKey: apiKey,
      httpOptions: { fetch: customFetch },
    };

    // Strip trailing API version prefix (e.g. /v1beta) since the SDK adds it automatically
    if (baseUrl) {
      let cleanUrl = baseUrl.replace(/\/+$/, '');
      const versionMatch = cleanUrl.match(/\/(v\d+(?:alpha|beta)?)$/);
      if (versionMatch) {
        cleanUrl = cleanUrl.slice(0, -versionMatch[0].length);
      }
      options.httpOptions.baseUrl = cleanUrl;
    }

    return new GoogleGenAI(options);
  }
};
