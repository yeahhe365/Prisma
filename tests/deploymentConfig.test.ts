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
});
