/**
 * Display helpers for the dashboard's "Tu próximo evento" card.
 *
 * Date words (month/weekday) are hand-rolled es/en maps instead of
 * `Intl.DateTimeFormat` because Hermes ships incomplete locale data — the same
 * code must render "NOV / SÁBADO" identically on iOS, Android, and in tests.
 * Date-only strings are parsed as UTC to avoid timezone off-by-one-day shifts.
 */

export interface UpcomingEventLike {
  start_date: string | null;
  end_date: string | null;
}

/**
 * The event to feature as "Evento principal": the soonest event that hasn't
 * finished yet (its `end_date`, falling back to `start_date`, is today or
 * later). Events without dates are skipped. Product decision: no featured
 * flag — the next upcoming event is always the principal one.
 */
export function selectNextUpcomingEvent<T extends UpcomingEventLike>(
  events: T[] | null | undefined,
  todayISO: string,
): T | null {
  const upcoming = (events ?? []).filter((e) => {
    const last = e.end_date ?? e.start_date;
    return last != null && last >= todayISO;
  });
  upcoming.sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''));
  return upcoming[0] ?? null;
}

export type DateWordsLocale = 'es' | 'en';

const MONTHS: Record<DateWordsLocale, string[]> = {
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
};

// Indexed by Date#getUTCDay() (0 = Sunday).
const WEEKDAYS: Record<DateWordsLocale, string[]> = {
  es: ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'],
  en: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
};

export interface EventDateBadge {
  day: string;
  month: string;
  weekday: string;
}

/** `'2025-11-15'` → `{ day: '15', month: 'NOV', weekday: 'SÁBADO' }`. */
export function formatEventDateBadge(
  dateISO: string | null | undefined,
  locale: DateWordsLocale = 'es',
): EventDateBadge | null {
  if (!dateISO) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateISO);
  if (!match) return null;
  const [, y, m, d] = match;
  const monthIndex = Number(m) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const weekday = WEEKDAYS[locale][new Date(Date.UTC(Number(y), monthIndex, Number(d))).getUTCDay()]!;
  return { day: String(Number(d)), month: MONTHS[locale][monthIndex]!, weekday };
}

/** `'09:00:00'` → `'9:00 AM'`. Accepts `HH:MM` or `HH:MM:SS` (Postgres `time`). */
export function formatTime12h(time: string | null | undefined): string | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  if (hours > 23) return null;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${match[2]} ${suffix}`;
}

/** `('09:00:00', '16:00:00')` → `'9:00 AM - 4:00 PM'`; null unless both parse. */
export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const from = formatTime12h(start);
  const to = formatTime12h(end);
  return from && to ? `${from} - ${to}` : null;
}
