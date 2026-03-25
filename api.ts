import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { ApiProvider, CustomModel, AIClient } from './types';

// --- Configuration & Types ---

type AIProviderConfig = {
  provider?: ApiProvider;
  apiKey?: string;
  baseUrl?: string;
};

// External API base URLs for production/default
const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  xai: 'https://api.x.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
  custom: '', // User defined
};

const isDevelopment = import.meta.env?.MODE === 'development' || process.env.NODE_ENV === 'development';

// --- Network Configuration State ---

let activeBaseUrl: string | null = null;
let activeProvider: ApiProvider | null = null;

/**
 * Configure the network layer with the current custom API settings.
 */
export const setNetworkConfig = (baseUrl: string | null, provider: ApiProvider | null = null) => {
  activeBaseUrl = baseUrl ? baseUrl.trim() : null;
  activeProvider = provider;

  if (activeBaseUrl && activeBaseUrl.endsWith('/')) {
    activeBaseUrl = activeBaseUrl.slice(0, -1);
  }

  console.log('[Network] Config updated:', { activeBaseUrl, activeProvider });
};

export const isGoogleProvider = (ai: any): boolean => {
  return ai?.models?.generateContent !== undefined;
};

// --- Custom Fetch for SDK-Level URL Rewriting ---

/**
 * Creates a custom fetch function that rewrites URLs for:
 * 1. Vite proxy requests (/custom-api → injects X-Target-URL header)
 * 2. Google GenAI SDK requests (googleapis.com → custom base URL)
 */
const createCustomFetch = (): typeof globalThis.fetch => {
  const nativeFetch = window.fetch.bind(window);

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString: string;
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else {
      urlString = input.url;
    }

    // Vite proxy: inject X-Target-URL header
    if (urlString.includes('/custom-api') && activeBaseUrl) {
      const headers = new Headers(init?.headers);
      headers.set('X-Target-URL', activeBaseUrl);
      return nativeFetch(input, { ...init, headers });
    }

    // Google GenAI SDK with custom baseUrl: deduplicate API version prefix
    // When httpOptions.baseUrl includes /v1beta, SDK still appends /v1beta in the path,
    // resulting in URLs like /v1beta/v1beta/models/... — fix by removing the duplicate
    if (activeBaseUrl) {
      const activeHost = (() => { try { return new URL(activeBaseUrl).host; } catch { return null; } })();
      if (activeHost && urlString.includes(activeHost)) {
        try {
          const url = new URL(urlString);
          const basePath = new URL(activeBaseUrl).pathname.replace(/\/$/, '');
          // Check for duplicated version prefix: /v1beta/v1beta or /v1/v1 etc.
          const versionPrefix = basePath.match(/\/v\d+(beta|alpha)?$/)?.[0];
          if (versionPrefix && url.pathname.includes(versionPrefix + versionPrefix)) {
            url.pathname = url.pathname.replace(versionPrefix + versionPrefix, versionPrefix);
            return nativeFetch(url.toString(), init);
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }

    // Google GenAI SDK: rewrite googleapis.com to custom base URL (fallback for non-httpOptions.baseUrl path)
    if (urlString.includes('generativelanguage.googleapis.com') && activeBaseUrl) {
      try {
        const url = new URL(urlString);
        const customUrl = new URL(activeBaseUrl);

        url.protocol = customUrl.protocol;
        url.host = customUrl.host;
        url.port = customUrl.port;

        // Replace the SDK's /v1beta (or /v1) prefix with the custom base path to avoid duplication
        const apiVersionMatch = url.pathname.match(/^\/v\d+(beta|alpha)?\//);
        if (apiVersionMatch && customUrl.pathname !== '/' && customUrl.pathname.length > 1) {
          const basePath = customUrl.pathname.endsWith('/')
            ? customUrl.pathname.slice(0, -1)
            : customUrl.pathname;
          url.pathname = basePath + url.pathname.slice(apiVersionMatch[0].length - 1);
        } else if (customUrl.pathname !== '/' && customUrl.pathname.length > 1) {
          const prefix = customUrl.pathname.endsWith('/')
            ? customUrl.pathname.slice(0, -1)
            : customUrl.pathname;
          url.pathname = prefix + url.pathname;
        }

        return nativeFetch(url.toString(), init);
      } catch (e) {
        console.warn('[Fetch] Failed to rewrite Google URL:', e);
      }
    }

    return nativeFetch(input, init);
  };
};

// --- Helper Functions ---

export const findCustomModel = (modelName: string, customModels?: CustomModel[]): CustomModel | undefined => {
  return customModels?.find(m => m.name === modelName);
};

export const getAIProvider = (model: string): ApiProvider => {
  if (model.startsWith('gpt-') || model.startsWith('o1-')) return 'openai';
  if (model.startsWith('deepseek-')) return 'deepseek';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('grok-')) return 'xai';
  if (model.startsWith('mistral-') || model.startsWith('mixtral-')) return 'mistral';
  if (model === 'custom') return 'custom';
  return 'google';
};

// --- API Client Factory ---

export const getAI = (config?: AIProviderConfig): AIClient => {
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env?.VITE_API_KEY || process.env.API_KEY;
  const customFetch = createCustomFetch();

  // Handle OpenAI-compatible providers
  if (['openai', 'deepseek', 'custom', 'anthropic', 'xai', 'mistral'].includes(provider)) {
    const options: any = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      fetch: customFetch,
    };

    if (config?.baseUrl) {
      options.baseURL = config.baseUrl;
    } else {
      const providerBaseUrl = PROVIDER_BASE_URLS[provider];
      if (providerBaseUrl) {
        options.baseURL = providerBaseUrl;
      }
    }

    return new OpenAI(options);
  }

  // Handle Google — use httpOptions.baseUrl for custom endpoint support
  else {
    const options: any = {
      apiKey: apiKey,
      httpOptions: { fetch: customFetch },
    };

    // If a custom base URL is configured, pass it to the Google SDK
    // Strip trailing API version prefix (e.g. /v1beta) since the SDK adds it automatically
    if (config?.baseUrl) {
      let baseUrl = config.baseUrl.replace(/\/+$/, '');
      const versionMatch = baseUrl.match(/\/(v\d+(?:alpha|beta)?)$/);
      if (versionMatch) {
        baseUrl = baseUrl.slice(0, -versionMatch[0].length);
      }
      options.httpOptions.baseUrl = baseUrl || 'https://generativelanguage.googleapis.com';
    }

    return new GoogleGenAI(options);
  }
};
