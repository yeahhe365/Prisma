
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

    const targetUrl = req.headers['x-target-url'] as string;
    if (!targetUrl) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing X-Target-URL header' }));
      return;
    }

    try {
      // Clean up target base URL to ensure no trailing slash
      let targetBase = targetUrl.trim();
      if (targetBase.endsWith('/')) {
        targetBase = targetBase.slice(0, -1);
      }

      // Extract path from original request (removing /custom-api prefix)
      const targetPath = req.url.replace(/^\/custom-api/, '');
      
      // Combine to form full URL, preserving the path from X-Target-URL
      const fullUrl = `${targetBase}${targetPath}`;
      const url = new URL(fullUrl);
      
      console.log('[Custom Proxy] Forwarding:', req.method, req.url, '->', fullUrl);

      // Collect request body
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const body = Buffer.concat(chunks);

      // Forward headers (excluding hop-by-hop headers)
      const forwardHeaders: Record<string, string> = {};
      const skipHeaders = ['host', 'connection', 'x-target-url', 'transfer-encoding'];
      for (const [key, value] of Object.entries(req.headers)) {
        if (!skipHeaders.includes(key.toLowerCase()) && value) {
          forwardHeaders[key] = Array.isArray(value) ? value[0] : value;
        }
      }
      forwardHeaders['host'] = url.host;

      // Make the request
      const response = await fetch(fullUrl, {
        method: req.method,
        headers: forwardHeaders,
        body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : body,
      });

      // Forward response status and headers
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
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
          // Proxy for OpenAI API
          '/openai/v1': {
            target: 'https://api.openai.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/openai\/v1/, '/v1'),
          },
          // Proxy for DeepSeek API
          '/deepseek/v1': {
            target: 'https://api.deepseek.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/deepseek\/v1/, '/v1'),
          },
          // Proxy for Anthropic API
          '/anthropic/v1': {
            target: 'https://api.anthropic.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/anthropic\/v1/, '/v1'),
          },
          // Proxy for xAI API
          '/xai/v1': {
            target: 'https://api.x.ai',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/xai\/v1/, '/v1'),
          },
          // Proxy for Mistral API
          '/mistral/v1': {
            target: 'https://api.mistral.ai',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/mistral\/v1/, '/v1'),
          },
          // Proxy for Google Gemini API
          '/v1beta/models': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            secure: true,
          },
          '/v1/models': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            secure: true,
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
