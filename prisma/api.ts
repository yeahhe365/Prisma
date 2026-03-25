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

    // Google GenAI SDK: rewrite googleapis.com to custom base URL
    if (urlString.includes('generativelanguage.googleapis.com') && activeBaseUrl) {
      try {
        const url = new URL(urlString);
        const customUrl = new URL(activeBaseUrl);

        url.protocol = customUrl.protocol;
        url.host = customUrl.host;
        url.port = customUrl.port;

        if (customUrl.pathname !== '/' && customUrl.pathname.length > 1) {
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
      if (isDevelopment) {
        options.baseURL = `${window.location.origin}/custom-api`;
      } else {
        options.baseURL = config.baseUrl;
        console.warn('[API] Using direct custom URL in production. CORS errors may occur.');
      }
    } else {
      const providerBaseUrl = PROVIDER_BASE_URLS[provider];

      if (isDevelopment && providerBaseUrl) {
        options.baseURL = `${window.location.origin}/custom-api`;
      } else if (providerBaseUrl) {
        options.baseURL = providerBaseUrl;
      }
    }

    return new OpenAI(options);
  }

  // Handle Google — pass custom fetch via httpOptions
  else {
    const options: any = {
      apiKey: apiKey,
      httpOptions: { fetch: customFetch },
    };

    return new GoogleGenAI(options);
  }
};
