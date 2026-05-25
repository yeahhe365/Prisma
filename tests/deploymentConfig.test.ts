import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(__dirname, '..');

describe('deployment configuration', () => {
  it('pins Cloudflare Pages to the Node.js major used by CI and Docker', () => {
    const nodeVersionPath = path.join(projectRoot, '.node-version');

    expect(existsSync(nodeVersionPath)).toBe(true);

    const nodeVersion = readFileSync(nodeVersionPath, 'utf8').trim();

    expect(nodeVersion).toMatch(/^22\./);
  });

  it('keeps the Docker-only API proxy out of the Cloudflare Pages config', () => {
    const dockerfile = readFileSync(path.join(projectRoot, 'Dockerfile'), 'utf8');
    const dockerComposeConfig = readFileSync(path.join(projectRoot, 'docker-compose.yml'), 'utf8');
    const wranglerConfig = readFileSync(path.join(projectRoot, 'wrangler.toml'), 'utf8');

    expect(dockerfile).toContain('VITE_API_PROXY_MODE=local');
    expect(dockerfile).toContain('CMD ["node", "server.mjs"]');
    expect(dockerComposeConfig).toContain('PRISMA_PROXY_ALLOWED_HOSTS:-*');
    expect(wranglerConfig).toContain('pages_build_output_dir = "dist"');
    expect(wranglerConfig).not.toContain('VITE_API_PROXY_MODE');
    expect(wranglerConfig).not.toContain('custom-api');
  });
});
