import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(__dirname, '..');
const recursiveLowercaseEntry = path.join(projectRoot, 'prisma');

describe('Cloudflare Pages path compatibility', () => {
  it('uses the repository root directly without a recursive lowercase symlink', () => {
    expect(existsSync(recursiveLowercaseEntry)).toBe(false);

    const packageJson = readFileSync(path.join(projectRoot, 'package.json'), 'utf8');
    expect(packageJson).toContain('"name": "prisma"');
  });
});
