
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';

// Custom middleware to handle dynamic proxy for /custom-api
function customApiProxyMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/custom-api')) {
      return next();
    }

    const targetUrlHeader = req.headers['x-target-url'];
    const targetUrl = Array.isArray(targetUrlHeader) ? targetUrlHeader[0] : targetUrlHeader;

    if (!targetUrl) {
      console.error('[Custom Proxy] Missing X-Target-URL header');
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing X-Target-URL header' }));
      return;
    }

    try {
      // 1. Clean up target base URL (remove trailing slash)
      let targetBase = targetUrl.trim();
      if (targetBase.endsWith('/')) {
        targetBase = targetBase.slice(0, -1);
      }

      // 2. Extract relative path (remove /custom-api prefix)
      let targetPath = req.url.replace(/^\/custom-api/, '');
      
      // 3. Ensure targetPath starts with /
      if (!targetPath.startsWith('/')) {
        targetPath = '/' + targetPath;
      }

      // 4. Construct full URL
      const fullUrl = `${targetBase}${targetPath}`;
      const url = new URL(fullUrl);
      
      console.log(`[Custom Proxy] ${req.method} ${req.url} -> ${fullUrl}`);

      // Collect request body
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const body = Buffer.concat(chunks);

      // Forward headers
      const forwardHeaders: Record<string, string> = {};
      // Filter out headers that confuse the upstream server or are hop-by-hop
      const skipHeaders = ['host', 'connection', 'x-target-url', 'transfer-encoding', 'origin', 'referer'];
      
      for (const [key, value] of Object.entries(req.headers)) {
        if (!skipHeaders.includes(key.toLowerCase()) && value) {
          forwardHeaders[key] = Array.isArray(value) ? value[0] : value;
        }
      }
      
      // Explicitly set Host to the target host (crucial for some APIs like OpenAI/Vercel)
      forwardHeaders['host'] = url.host;
      forwardHeaders['accept-encoding'] = 'identity'; // Disable compression to simplify relay

      const fetchOptions: RequestInit = {
        method: req.method,
        headers: forwardHeaders,
        body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : body,
      };

      const response = await fetch(fullUrl, fetchOptions);

      // Forward response status and headers
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection', 'content-encoding', 'content-length'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      // Stream the response body
      if (response.body) {
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      res.end();
      
    } catch (error: any) {
      console.error('[Custom Proxy] Error:', error.message);
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Fallback proxies for specific known routes if not using custom-api
          '/openai/v1': {
            target: 'https://api.openai.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/openai\/v1/, '/v1'),
          },
        }
      },
      plugins: [
        react(),
        {
          name: 'custom-api-proxy',
          configureServer(server) {
            server.middlewares.use(customApiProxyMiddleware());
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
