/**
 * Time-of-day bucket for the dashboard greeting subtitle ("Buenas tardes.").
 * Returns an i18n key suffix — the screen resolves `home.timeOfDay.{key}`.
 */
export type TimeOfDayKey = 'morning' | 'afternoon' | 'evening';

export function timeOfDayKey(hour: number): TimeOfDayKey {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'afternoon';
  return 'evening';
}
