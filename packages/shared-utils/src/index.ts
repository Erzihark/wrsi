import type { Enums } from '@wrsi/shared-types';

/**
 * Normalize a name/email for duplicate detection: trim, lowercase, strip accents.
 * Used by the Monday.com import dedup logic.
 */
export function normalizeForDedup(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Strip characters that carry meaning inside a PostgREST filter (`or(...)`
 * grouping and `ilike` wildcards) so a stray token typed into a search box can't
 * malform the request. Returns the trimmed, sanitized term, or `''` for nullish
 * input. RLS still bounds the result regardless — this is about query integrity.
 */
export function sanitizeSearchTerm(search?: string | null): string {
  return (search ?? '').trim().replace(/[(),*]/g, '');
}

/** Join first/last name into a display string, skipping empty parts. */
export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ').trim();
}

/** Human-readable label for an intake term enum value. */
export function intakeTermLabel(term: Enums<'intake_term'>): string {
  const labels: Record<Enums<'intake_term'>, string> = {
    fall: 'Fall',
    winter: 'Winter',
    spring_summer: 'Spring / Summer',
  };
  return labels[term];
}

/** Intake years selectable during onboarding: current year through +6. */
export function intakeYearOptions(now: Date = new Date()): number[] {
  const start = now.getFullYear();
  return Array.from({ length: 7 }, (_, i) => start + i);
}

/**
 * Format a structured event location — "State, Country" — from the embedded
 * country/state names, skipping missing parts. `spanish` picks the Spanish
 * country name when available (state names are stored in their local form).
 */
export function formatGeography(
  country: { name: string; name_es: string | null } | null | undefined,
  state: { name: string } | null | undefined,
  spanish = false,
): string {
  const countryName = country ? (spanish ? country.name_es ?? country.name : country.name) : null;
  return [state?.name, countryName].filter(Boolean).join(', ');
}
