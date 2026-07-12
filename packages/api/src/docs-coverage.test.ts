// Keeps docs/API.md in sync with the hooks layer: every exported use* hook in a
// domain file must have a (backtick-referenced) row in the contract index.
// Presence-only by design — row *content* freshness is the "API changes"
// checklist's job (CLAUDE.md); this test just makes "forgot the docs" a red build.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_DIR = __dirname;
const API_MD = join(SRC_DIR, '..', '..', '..', 'docs', 'API.md');

// Infrastructure modules that export no user-facing hooks.
const EXCLUDED = new Set(['client.ts', 'context.tsx', 'queryKeys.ts', 'index.ts']);

function domainFiles(): string[] {
  return readdirSync(SRC_DIR).filter(
    (f) =>
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.endsWith('.test.ts') &&
      !EXCLUDED.has(f),
  );
}

function exportedHooks(file: string): string[] {
  const source = readFileSync(join(SRC_DIR, file), 'utf8');
  return [...source.matchAll(/^export function (use\w+)/gm)].map((m) => m[1] as string);
}

describe('docs/API.md coverage', () => {
  const apiMd = readFileSync(API_MD, 'utf8');

  for (const file of domainFiles()) {
    const hooks = exportedHooks(file);
    if (hooks.length === 0) continue;

    it(`documents every hook exported from ${file}`, () => {
      for (const hook of hooks) {
        expect(
          apiMd.includes(`\`${hook}`),
          `Hook ${hook} is exported from packages/api/src/${file} but has no ` +
            `row in docs/API.md — add one (see CLAUDE.md "API changes").`,
        ).toBe(true);
      }
    });
  }

  it('finds the domain files at all (guards against a moved directory)', () => {
    expect(domainFiles().length).toBeGreaterThan(5);
  });
});
