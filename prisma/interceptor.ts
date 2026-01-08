/**
 * Network Interceptor
 * 
 * Intercepts global fetch calls to redirect Gemini API requests
 * from the default endpoint to a user-defined custom base URL.
 * 
 * Uses Object.defineProperty to bypass "getter-only" restrictions on window.fetch
 * in certain sandboxed or strict environments.
 */

const originalFetch = window.fetch;

/**
 * Robustly applies a function to the window.fetch property.
 */
const applyFetch = (fn: typeof window.fetch) => {
  try {
    Object.defineProperty(window, 'fetch', {
      value: fn,
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (e) {
    // Fallback for environments where defineProperty on window might fail
    try {
      (window as any).fetch = fn;
    } catch (err) {
      console.error("[Prisma] Critical: Failed to intercept fetch.", err);
    }
  }
};

export const setInterceptorUrl = (baseUrl: string | null) => {
  if (!baseUrl) {
    // Restore original fetch when disabled
    applyFetch(originalFetch);
    return;
  }

  // Normalize the base URL
  let normalizedBase = baseUrl.trim();
  try {
    // Basic validation
    new URL(normalizedBase);
  } catch (e) {
    console.warn("[Prisma] Invalid Base URL provided:", normalizedBase);
    return;
  }

  if (normalizedBase.endsWith('/')) {
    normalizedBase = normalizedBase.slice(0, -1);
  }

  const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString: string;
    
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else {
      urlString = input.url;
    }

    const defaultHost = 'generativelanguage.googleapis.com';

    // Check if the request is targeting the Google Gemini API
    if (urlString.includes(defaultHost)) {
      try {
        const url = new URL(urlString);
        const proxy = new URL(normalizedBase);
        
        // Replace protocol and host
        url.protocol = proxy.protocol;
        url.host = proxy.host;
        
        // Prepend proxy path if it exists (e.g., /v1/proxy)
        if (proxy.pathname !== '/') {
            const cleanPath = proxy.pathname.endsWith('/') ? proxy.pathname.slice(0, -1) : proxy.pathname;
            // Ensure we don't double up slashes
            url.pathname = cleanPath + url.pathname;
        }

        const newUrl = url.toString();

        // Handle the different types of fetch inputs
        if (input instanceof Request) {
          // Re-create the request with the new URL and original properties
          const requestData: RequestInit = {
            method: input.method,
            headers: input.headers,
            body: input.body,
            mode: input.mode,
            credentials: input.credentials,
            cache: input.cache,
            redirect: input.redirect,
            referrer: input.referrer,
            integrity: input.integrity,
          };
          
          // Merge with init if provided
          const mergedInit = { ...requestData, ...init };
          
          return originalFetch(new URL(newUrl), mergedInit);
        }
        
        return originalFetch(newUrl, init);
      } catch (e) {
        console.error("[Prisma Interceptor] Failed to redirect request:", e);
      }
    }

    return originalFetch(input, init);
  };

  applyFetch(interceptedFetch);
};
