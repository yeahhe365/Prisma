/**
 * DEPRECATED
 * 
 * Network interception logic has been moved to api.ts to ensure a single, 
 * unified fetch wrapper that handles both OpenAI Proxy headers (X-Target-URL)
 * and Google GenAI base URL rewriting.
 * 
 * This file remains as a placeholder to prevent import errors during hot-reload 
 * but performs no operations.
 */

export const setInterceptorUrl = (baseUrl: string | null) => {
  // No-op
  // See api.ts -> setNetworkConfig for the active implementation.
};
