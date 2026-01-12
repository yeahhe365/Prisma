
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { ApiProvider, CustomModel } from './types';
import { logger } from './services/logger';

type AIProviderConfig = {
  provider?: ApiProvider;
  apiKey?: string;
  baseUrl?: string;
};

export const findCustomModel = (modelName: string, customModels?: CustomModel[]): CustomModel | undefined => {
  return customModels?.find(m => m.name === modelName);
};

// External API base URLs for production
const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  xai: 'https://api.x.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
  custom: '',
};

// Check if we're in development mode
const isDevelopment = import.meta.env?.MODE === 'development' || process.env.NODE_ENV === 'development';

// Store the current custom API target URL
let currentCustomApiUrl: string | null = null;

// Setup fetch interceptor to add X-Target-URL header for custom API proxy
const originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

if (typeof window !== 'undefined' && originalFetch) {
  const proxyFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString: string;
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else {
      urlString = input.url;
    }
    
    // If this is a custom-api request and we have a target URL, add the header
    if (urlString.includes('/custom-api') && currentCustomApiUrl) {
      const headers = new Headers(init?.headers);
      headers.set('X-Target-URL', currentCustomApiUrl);
      
      logger.debug('API', 'Using Custom Proxy', { target: currentCustomApiUrl, path: urlString });
      
      return originalFetch(input, {
        ...init,
        headers,
      });
    }
    
    return originalFetch(input, init);
  };

  try {
    window.fetch = proxyFetch;
    logger.info('System', 'Fetch proxy interceptor installed');
  } catch (e) {
    try {
      Object.defineProperty(window, 'fetch', {
        value: proxyFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (e2) {
      console.error('[API] Failed to intercept fetch:', e2);
      logger.error('System', 'Failed to intercept fetch', e2);
    }
  }
}

export const getAI = (config?: AIProviderConfig) => {
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env?.VITE_API_KEY || process.env.API_KEY;

  if (provider === 'openai' || provider === 'deepseek' || provider === 'custom' || provider === 'anthropic' || provider === 'xai' || provider === 'mistral') {
    const options: any = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    };

    if (config?.baseUrl) {
      // Custom baseUrl from Configuration UI
      if (isDevelopment) {
        // Store the target URL for the fetch interceptor
        currentCustomApiUrl = config.baseUrl;
        // Use proxy path
        options.baseURL = `${window.location.origin}/custom-api`;
      } else {
        // In production, use the URL directly
        options.baseURL = config.baseUrl;
      }
    } else {
      const providerBaseUrl = PROVIDER_BASE_URLS[provider];
      if (providerBaseUrl) {
        if (isDevelopment) {
          // In development, use proxy to avoid CORS for known providers
          options.baseURL = `${window.location.origin}/${provider}/v1`;
        } else {
          options.baseURL = providerBaseUrl;
        }
      }
    }

    logger.info('API', 'Initializing OpenAI Client', { 
      provider, 
      baseURL: options.baseURL,
      isCustom: provider === 'custom'
    });
    
    return new OpenAI(options);
  } else {
    const options: any = {
      apiKey: apiKey,
    };

    if (config?.baseUrl) {
      options.baseUrl = config.baseUrl;
    }

    logger.info('API', 'Initializing Google GenAI Client');
    return new GoogleGenAI(options);
  }
};

export const getAIProvider = (model: string): ApiProvider => {
  if (model.startsWith('gpt-') || model.startsWith('o1-')) {
    return 'openai';
  }
  if (model.startsWith('deepseek-')) {
    return 'deepseek';
  }
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  if (model.startsWith('grok-')) {
    return 'xai';
  }
  if (model.startsWith('mistral-') || model.startsWith('mixtral-')) {
    return 'mistral';
  }
  if (model === 'custom') {
    return 'custom';
  }
  return 'google';
};
