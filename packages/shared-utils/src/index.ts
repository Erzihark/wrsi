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
