import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(__dirname, '..');
const pagesEntry = path.join(projectRoot, 'prisma');

describe('Cloudflare Pages path compatibility', () => {
  it('provides a lowercase prisma entry that resolves to the repository root', () => {
    const stat = lstatSync(pagesEntry);
    expect(stat.isSymbolicLink()).toBe(true);

    const packageJson = readFileSync(path.join(pagesEntry, 'package.json'), 'utf8');
    expect(packageJson).toContain('"name": "prisma"');
  });
});
