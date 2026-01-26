import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { ApiProvider, CustomModel } from './types';

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

// --- Unified Network Interceptor ---

// Global state for the interceptor
let activeBaseUrl: string | null = null;
let activeProvider: ApiProvider | null = null;

/**
 * Configure the network layer with the current custom API settings.
 * This is called by the UI when settings change.
 */
export const setNetworkConfig = (baseUrl: string | null, provider: ApiProvider | null = null) => {
  activeBaseUrl = baseUrl ? baseUrl.trim() : null;
  activeProvider = provider;
  
  // Normalize base URL (remove trailing slash)
  if (activeBaseUrl && activeBaseUrl.endsWith('/')) {
    activeBaseUrl = activeBaseUrl.slice(0, -1);
  }

  console.log('[Network] Config updated:', { activeBaseUrl, activeProvider });
};

// Store original fetch once and bind it to window to prevent illegal invocation errors
const originalFetch = window.fetch.bind(window);

// The unified proxy fetch function
const proxyFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let urlString: string;
  if (typeof input === 'string') {
    urlString = input;
  } else if (input instanceof URL) {
    urlString = input.toString();
  } else {
    urlString = input.url;
  }

  // Scenario 1: Local Vite Proxy Request (OpenAI/Custom)
  // We identify this by the path starting with /custom-api
  if (urlString.includes('/custom-api') && activeBaseUrl) {
    const headers = new Headers(init?.headers);
    
    // Inject the target URL for the Vite middleware
    headers.set('X-Target-URL', activeBaseUrl);
    
    console.debug('[Fetch Proxy] Proxying to:', activeBaseUrl, 'Path:', urlString);
    
    return originalFetch(input, {
      ...init,
      headers,
    });
  }

  // Scenario 2: Google Gemini Interception (Google GenAI SDK)
  // The SDK calls googleapis.com. We redirect if a custom base URL is set.
  if (urlString.includes('generativelanguage.googleapis.com') && activeBaseUrl) {
    try {
      const url = new URL(urlString);
      const customUrl = new URL(activeBaseUrl);
      
      // Replace protocol and host
      url.protocol = customUrl.protocol;
      url.host = customUrl.host;
      url.port = customUrl.port;
      
      // Prepend custom path if exists (e.g. if customUrl is http://localhost:8080/gemini-proxy)
      if (customUrl.pathname !== '/' && customUrl.pathname.length > 1) {
        // Avoid double slashes
        const prefix = customUrl.pathname.endsWith('/') ? customUrl.pathname.slice(0, -1) : customUrl.pathname;
        url.pathname = prefix + url.pathname;
      }

      console.debug('[Fetch Google] Redirecting Gemini to:', url.toString());
      
      return originalFetch(url.toString(), init);
    } catch (e) {
      console.warn('[Fetch Google] Failed to rewrite URL:', e);
    }
  }

  return originalFetch(input, init);
};

// Apply the interceptor safely
try {
  window.fetch = proxyFetch;
} catch (e) {
  // If direct assignment fails (e.g., getter-only property), try defineProperty
  console.warn('[Network] Direct override of window.fetch failed, attempting Object.defineProperty');
  try {
    Object.defineProperty(window, 'fetch', {
      value: proxyFetch,
      writable: true,
      configurable: true
    });
  } catch (e2) {
    console.error('[Network] Critical: Failed to install fetch interceptor', e2);
  }
}

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

export const getAI = (config?: AIProviderConfig) => {
  const provider = config?.provider || 'google';
  const apiKey = config?.apiKey || import.meta.env?.VITE_API_KEY || process.env.API_KEY;

  // Handle OpenAI-compatible providers
  if (['openai', 'deepseek', 'custom', 'anthropic', 'xai', 'mistral'].includes(provider)) {
    const options: any = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    };

    if (config?.baseUrl) {
      // 1. Explicit Custom URL provided (via Settings > Custom Models)
      if (isDevelopment) {
        // In Dev: Route through local proxy to avoid CORS
        options.baseURL = `${window.location.origin}/custom-api`;
        // The interceptor will pick up the real URL from `activeBaseUrl` via setNetworkConfig
      } else {
        // In Prod: Direct connection (Warning: CORS might fail if not using a proxy)
        options.baseURL = config.baseUrl; 
        console.warn('[API] Using direct custom URL in production. CORS errors may occur.');
      }
    } else {
      // 2. Preset Provider (e.g. "DeepSeek" selected from dropdown)
      const providerBaseUrl = PROVIDER_BASE_URLS[provider];
      
      if (isDevelopment && providerBaseUrl) {
         // In Dev: Use proxy for known providers too, to avoid CORS issues
         options.baseURL = `${window.location.origin}/custom-api`;
         // IMPORTANT: The UI/Hook must have called setNetworkConfig(providerBaseUrl) for this to work
      } else if (providerBaseUrl) {
         options.baseURL = providerBaseUrl;
      }
    }

    return new OpenAI(options);
  } 
  
  // Handle Google
  else {
    const options: any = {
      apiKey: apiKey,
    };
    
    // Google SDK doesn't support 'baseUrl' in constructor easily, 
    // but our fetch interceptor handles the rewrite if `config.baseUrl` was set in the UI.
    return new GoogleGenAI(options);
  }
};
