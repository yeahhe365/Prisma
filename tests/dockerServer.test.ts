import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  buildProxyTargetUrl,
  createPrismaServer,
  isAllowedTarget,
  parseAllowedHosts,
} from '@/docker/server.mjs';

const servers: Server[] = [];
const tempDirs: string[] = [];

const startServer = async (server: Server): Promise<number> => {
  servers.push(server);

  return await new Promise<number>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve((server.address() as AddressInfo).port);
    });
  });
};

const closeServer = async (server: Server): Promise<void> => {
  if (!server.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const makeStaticDir = async () => {
  const staticDir = await mkdtemp(path.join(tmpdir(), 'prisma-static-'));
  tempDirs.push(staticDir);
  await writeFile(path.join(staticDir, 'index.html'), '<main>Prisma Docker</main>');

  return staticDir;
};

afterEach(async () => {
  await Promise.all(servers.splice(0).map(closeServer));
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe('docker runtime server', () => {
  it('serves the built app with history fallback', async () => {
    const staticDir = await makeStaticDir();
    const server = createPrismaServer({ staticDir });
    const port = await startServer(server);

    const response = await fetch(`http://127.0.0.1:${port}/chat/session-1`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('Prisma Docker');
  });

  it('falls back to the app shell for malformed encoded paths', async () => {
    const staticDir = await makeStaticDir();
    const server = createPrismaServer({ staticDir });
    const port = await startServer(server);

    const response = await fetch(`http://127.0.0.1:${port}/%E0%A4%A`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Prisma Docker');
  });

  it('forwards custom API requests from the local Docker server', async () => {
    const upstream = createServer((req, res) => {
      const chunks: Buffer[] = [];

      req.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify({
            body: Buffer.concat(chunks).toString('utf8'),
            host: req.headers.host,
            method: req.method,
            targetUrl: req.headers['x-target-url'] ?? null,
            url: req.url,
          }),
        );
      });
    });
    const upstreamPort = await startServer(upstream);

    const staticDir = await makeStaticDir();
    const server = createPrismaServer({
      staticDir,
      allowedHosts: new Set(['127.0.0.1']),
    });
    const port = await startServer(server);
    const targetOrigin = `http://127.0.0.1:${upstreamPort}`;

    const response = await fetch(
      `http://127.0.0.1:${port}/custom-api/v1/chat/completions?stream=true`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer docker-key',
          'Content-Type': 'application/json',
          'X-Target-URL': targetOrigin,
        },
        body: JSON.stringify({ messages: [] }),
      },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      body: JSON.stringify({ messages: [] }),
      host: `127.0.0.1:${upstreamPort}`,
      method: 'POST',
      targetUrl: null,
      url: '/v1/chat/completions?stream=true',
    });
  });

  it('keeps proxy targets constrained to configured hosts', () => {
    const allowedHosts = parseAllowedHosts('local-ai.example.com, api.example.com');

    expect(isAllowedTarget(new URL('https://local-ai.example.com'), allowedHosts)).toBe(true);
    expect(isAllowedTarget(new URL('https://blocked.example.com'), allowedHosts)).toBe(false);
    expect(buildProxyTargetUrl('/custom-api/v1/models?limit=1', 'https://api.example.com/v1')).toBe(
      'https://api.example.com/v1/v1/models?limit=1',
    );
  });

  it('allows any proxy target when the wildcard host is configured', () => {
    const allowedHosts = parseAllowedHosts('*');

    expect(isAllowedTarget(new URL('https://inferaichat.com'), allowedHosts)).toBe(true);
    expect(isAllowedTarget(new URL('https://any-compatible-api.example.com'), allowedHosts)).toBe(
      true,
    );
  });
});
