import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression coverage for the admin-managed directory entities (high schools,
 * universities, counselors): creating/updating/deleting one via `useCreateEntity`
 * must invalidate BOTH the admin CRUD list (e.g. `HighSchoolsListScreen`) and any
 * dropdown/lookup hook built on the same table (e.g. the "assign high school"
 * picker used on student screens), or the second consumer silently shows stale
 * data for up to an hour (`ONE_HOUR` staleTime in lookups.ts).
 *
 * High schools regressed this way: `useHighSchools()` (lookups.ts) used to key
 * off `queryKeys.lookup('high_schools')`, a different top-level key than
 * `listKey('high_school')` (`queryKeys.highSchools()`), which `useCreateEntity`
 * actually invalidates — so the admin list refreshed immediately after creating a
 * high school but the "assign high school" dropdown elsewhere did not. Universities
 * and counselors never had this split, which is why the bug only showed up for
 * high schools.
 *
 * This test calls the real hooks (not a re-derivation of queryKeys.ts) so it
 * fails if a hook's `queryKey` ever drifts from what `listKey` invalidates.
 */

const capturedKeys: unknown[][] = [];

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryKey: unknown[] }) => {
    capturedKeys.push(opts.queryKey);
    return { data: undefined, isLoading: true };
  },
  useMutation: (opts: unknown) => opts,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('./context', () => ({
  useSupabase: () => ({
    from: () => {
      const chainable: Record<string, unknown> = {};
      const self = () => chainable;
      chainable.select = self;
      chainable.order = self;
      chainable.ilike = self;
      chainable.eq = self;
      chainable.single = self;
      return chainable;
    },
  }),
}));

/**
 * Mirrors TanStack Query's `partialMatchKey`: objects match when every key in
 * `a` is present with an equal value in `b` (extra keys in `b` are fine), not
 * strict deep equality — e.g. `{}` partially matches `{ search: '' }`.
 */
function partialMatchKey(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a === 'object') {
    return Object.keys(a as object).every((key) =>
      partialMatchKey((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }
  return false;
}

/** True when every element of `prefix` partial-matches the same-index element of `key`. */
function isKeyPrefix(prefix: readonly unknown[], key: readonly unknown[]): boolean {
  return prefix.length <= key.length && prefix.every((el, i) => partialMatchKey(el, key[i]));
}

describe('directory entity cache invalidation', () => {
  beforeEach(() => {
    capturedKeys.length = 0;
    vi.resetModules();
  });

  it('the high-school write invalidation key covers both the admin list and the picker dropdown', async () => {
    const { listKey } = await import('./entities');
    const { useHighSchoolsList } = await import('./directory');
    const { useHighSchools } = await import('./lookups');

    useHighSchoolsList('');
    useHighSchools();

    expect(capturedKeys).toHaveLength(2);
    const [listQueryKey, lookupQueryKey] = capturedKeys as [unknown[], unknown[]];
    const invalidateKey = listKey('high_school');

    expect(isKeyPrefix(invalidateKey, listQueryKey)).toBe(true);
    expect(isKeyPrefix(invalidateKey, lookupQueryKey)).toBe(true);
  });

  it('the university write invalidation key covers both the admin list and the picker dropdown', async () => {
    const { listKey } = await import('./entities');
    const { useUniversitiesList } = await import('./directory');
    const { useUniversities } = await import('./hooks');

    useUniversitiesList('');
    useUniversities();

    expect(capturedKeys).toHaveLength(2);
    const [listQueryKey, lookupQueryKey] = capturedKeys as [unknown[], unknown[]];
    const invalidateKey = listKey('university');

    expect(isKeyPrefix(invalidateKey, listQueryKey)).toBe(true);
    expect(isKeyPrefix(invalidateKey, lookupQueryKey)).toBe(true);
  });

  it('the counselor write invalidation key covers both the admin list and the picker dropdown', async () => {
    const { listKey } = await import('./entities');
    const { useCounselorsList } = await import('./directory');
    const { useCounselors } = await import('./lookups');

    useCounselorsList('');
    useCounselors();

    expect(capturedKeys).toHaveLength(2);
    const [listQueryKey, lookupQueryKey] = capturedKeys as [unknown[], unknown[]];
    const invalidateKey = listKey('counselor');

    expect(isKeyPrefix(invalidateKey, listQueryKey)).toBe(true);
    expect(isKeyPrefix(invalidateKey, lookupQueryKey)).toBe(true);
  });
});
