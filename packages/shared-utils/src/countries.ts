/**
 * Country-picker helpers shared by every country dropdown (phone extension,
 * nationality, country of interest, event location…).
 *
 * The `countries` lookup is ~200 rows, but in practice WRSI's users pick from a
 * handful. Rather than making everyone scroll or search for them, the pickers
 * surface a "quick selection" group pinned above the full alphabetical list.
 */

/** Minimal country shape these helpers need (a subset of the `countries` row). */
export interface CountryLike {
  id: string;
  name: string;
  name_es?: string | null;
  iso_code: string;
  calling_code?: string | null;
}

/**
 * ISO 3166-1 alpha-2 codes pinned to the top of every country picker, in the
 * order they should appear. Mexico is where essentially all students are, and
 * the US is the dominant study destination — those two cover the vast majority
 * of selections. Edit this list to change the quick selection app-wide.
 */
export const PRIORITY_COUNTRY_ISOS = ['MX', 'US'] as const;

/**
 * The ids of the priority countries present in `rows`, ordered by
 * {@link PRIORITY_COUNTRY_ISOS} (not by the order of `rows`). Codes with no
 * matching row are skipped, so a lookup table missing one won't break the list.
 */
export function priorityCountryIds<T extends CountryLike>(
  rows: T[],
  isos: readonly string[] = PRIORITY_COUNTRY_ISOS,
): string[] {
  const byIso = new Map<string, string>();
  for (const row of rows) {
    const code = row.iso_code?.toUpperCase();
    // First row wins, so a duplicate ISO can't shadow the canonical country.
    if (code && !byIso.has(code)) byIso.set(code, row.id);
  }
  return isos
    .map((iso) => byIso.get(iso.toUpperCase()))
    .filter((id): id is string => id != null);
}

/** Country name in the app language, falling back to the English name. */
export function countryDisplayName(row: CountryLike, spanish = false): string {
  return (spanish ? row.name_es : null) ?? row.name;
}

/**
 * Extra search terms for a country row, so the picker also matches on the ISO
 * code ("MX"), the dial code ("+52"/"52") and the name in the *other* language —
 * a Spanish-locale user searching "Germany" still finds "Alemania".
 */
export function countrySearchKeywords(row: CountryLike): string[] {
  const calling = row.calling_code ?? null;
  return [
    row.name,
    row.name_es ?? null,
    row.iso_code,
    calling,
    // Also match the dial code typed without the leading "+".
    calling ? calling.replace(/^\+/, '') : null,
  ].filter((s): s is string => Boolean(s));
}
