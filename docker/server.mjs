import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';

export const DEFAULT_ALLOWED_HOSTS = Object.freeze([
  'generativelanguage.googleapis.com',
  'api.openai.com',
  'api.deepseek.com',
  'api.anthropic.com',
  'api.groq.com',
  'api.mistral.ai',
  'open.bigmodel.cn',
  'dashscope.aliyuncs.com',
]);

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const STATIC_CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const STATIC_CACHE_EXTENSIONS = new Set([
  '.css',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.png',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
]);

const isDebugEnabled = () => process.env.PRISMA_PROXY_DEBUG === 'true';

export const parseAllowedHosts = (value = process.env.PRISMA_PROXY_ALLOWED_HOSTS) => {
  const hosts = new Set(DEFAULT_ALLOWED_HOSTS);

  if (!value) {
    return hosts;
  }

  for (const host of value.split(',')) {
    const trimmed = host.trim().toLowerCase();
    if (trimmed) {
      hosts.add(trimmed);
    }
  }

  return hosts;
};

export const isAllowedTarget = (url, allowedHosts = parseAllowedHosts()) => {
  return allowedHosts.has('*') || allowedHosts.has(url.hostname.toLowerCase());
};

export const buildProxyTargetUrl = (requestUrl, targetBaseUrl) => {
  const incomingUrl = new URL(requestUrl, 'http://localhost');
  const targetBase = targetBaseUrl.trim().replace(/\/+$/, '');
  let targetPath = incomingUrl.pathname.replace(/^\/custom-api/, '');

  if (!targetPath.startsWith('/')) {
    targetPath = `/${targetPath}`;
  }

  return `${targetBase}${targetPath}${incomingUrl.search}`;
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const createForwardHeaders = (req, targetUrl) => {
  const headers = {};

  for (const [key, value] of Object.entries(req.headers)) {
    const normalizedKey = key.toLowerCase();
    if (
      HOP_BY_HOP_HEADERS.has(normalizedKey) ||
      normalizedKey === 'origin' ||
      normalizedKey === 'referer' ||
      normalizedKey === 'x-target-url'
    ) {
      continue;
    }

    if (value) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  headers.host = targetUrl.host;
  headers['accept-encoding'] = 'identity';

  return headers;
};

const handleProxyRequest = async (req, res, allowedHosts) => {
  const targetUrlHeader = req.headers['x-target-url'];
  const targetUrlText = Array.isArray(targetUrlHeader) ? targetUrlHeader[0] : targetUrlHeader;

  if (!targetUrlText) {
    sendJson(res, 400, { error: 'Missing X-Target-URL header' });
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(targetUrlText);
  } catch {
    sendJson(res, 400, { error: 'Invalid X-Target-URL header' });
    return;
  }

  if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
    sendJson(res, 403, { error: 'Unsupported protocol' });
    return;
  }

  if (!isAllowedTarget(targetUrl, allowedHosts)) {
    sendJson(res, 403, { error: 'Target host not allowed' });
    return;
  }

  try {
    const upstreamUrl = buildProxyTargetUrl(req.url ?? '/custom-api', targetUrl.toString());

    if (isDebugEnabled()) {
      console.debug(`[Prisma Proxy] ${req.method} ${req.url} -> ${upstreamUrl}`);
    }

    const method = req.method ?? 'GET';
    const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(req);
    const response = await fetch(upstreamUrl, {
      method,
      headers: createForwardHeaders(req, targetUrl),
      body,
    });

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Prisma Proxy] Error:', message);
    sendJson(res, 502, { error: 'Proxy error', message });
  }
};

const getContentType = (filePath) => {
  return (
    STATIC_CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream'
  );
};

const sendFile = async (res, filePath, method) => {
  const fileStat = await stat(filePath);
  const extension = path.extname(filePath).toLowerCase();

  res.writeHead(200, {
    'content-length': fileStat.size,
    'content-type': getContentType(filePath),
    ...(STATIC_CACHE_EXTENSIONS.has(extension)
      ? { 'cache-control': 'public, max-age=31536000, immutable' }
      : { 'cache-control': 'no-cache' }),
  });

  if (method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
};

const resolveStaticPath = (staticDir, requestUrl) => {
  const incomingUrl = new URL(requestUrl, 'http://localhost');
  let decodedPath = '/';

  try {
    decodedPath = decodeURIComponent(incomingUrl.pathname);
  } catch {
    decodedPath = '/';
  }

  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(staticDir, relativePath);
  const staticRoot = path.resolve(staticDir);

  if (filePath !== staticRoot && !filePath.startsWith(`${staticRoot}${path.sep}`)) {
    return path.join(staticRoot, 'index.html');
  }

  return filePath;
};

const handleStaticRequest = async (req, res, staticDir) => {
  const method = req.method ?? 'GET';

  if (method !== 'GET' && method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }

  const requestedPath = resolveStaticPath(staticDir, req.url ?? '/');

  try {
    const fileStat = await stat(requestedPath);
    const filePath = fileStat.isDirectory()
      ? path.join(requestedPath, 'index.html')
      : requestedPath;
    await sendFile(res, filePath, method);
  } catch {
    try {
      await sendFile(res, path.join(staticDir, 'index.html'), method);
    } catch {
      sendJson(res, 404, { error: 'Not found' });
    }
  }
};

export const createPrismaServer = ({ staticDir, allowedHosts } = {}) => {
  const resolvedStaticDir = staticDir ?? process.env.PRISMA_STATIC_DIR ?? path.resolve('dist');
  const resolvedAllowedHosts = allowedHosts ?? parseAllowedHosts();

  return createServer(async (req, res) => {
    if (req.url?.startsWith('/custom-api')) {
      await handleProxyRequest(req, res, resolvedAllowedHosts);
      return;
    }

    await handleStaticRequest(req, res, resolvedStaticDir);
  });
};

const startServer = () => {
  const port = Number(process.env.PORT || 80);
  const staticDir = process.env.PRISMA_STATIC_DIR ?? path.resolve('dist');
  const server = createPrismaServer({ staticDir });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Prisma] Docker server listening on :${port}`);
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer();
}
