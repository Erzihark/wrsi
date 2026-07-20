import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { es } from './es';

/** Recursively collects dot-notation leaf paths from a nested translation object. */
function leafPaths(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, value]) =>
      leafPaths(value, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

/** Resolves a dot-notation path (e.g. `onboarding.intendedLevel`) against a resource tree. */
function resolvePath(node: unknown, path_: string): unknown {
  return path_.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[segment];
    return undefined;
  }, node);
}

const MOBILE_SRC = path.resolve(__dirname, '../../../../apps/mobile/src');

/** Recursively lists every .ts/.tsx file under a directory. */
function walkSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return walkSourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Extracts literal keys passed to `t('...')` / `t("...")` — dynamic/templated keys are skipped. */
function extractTranslationKeys(source: string): string[] {
  const matches = source.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g);
  return [...matches].map((m) => m[1]).filter((key): key is string => key !== undefined);
}

describe('locale resources', () => {
  it('en and es expose the exact same set of keys', () => {
    const enPaths = leafPaths(en).sort();
    const esPaths = leafPaths(es).sort();
    // A regression here means one locale silently falls back (or renders raw
    // keys) for whatever the other locale added/renamed and it didn't.
    expect(esPaths).toEqual(enPaths);
  });

  it('every t(\'...\') call in the mobile app resolves to a real key', () => {
    const keysUsed = new Set(
      walkSourceFiles(MOBILE_SRC).flatMap((file) => extractTranslationKeys(readFileSync(file, 'utf8'))),
    );

    const missing = [...keysUsed].filter((key) => typeof resolvePath(en, key) !== 'string');

    // If this fails, `t(key)` renders the raw key string on-device instead of
    // localized text — this is exactly the bug this test guards against.
    expect(missing).toEqual([]);
  });
});
