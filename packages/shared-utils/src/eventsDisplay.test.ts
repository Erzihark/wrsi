import { describe, expect, it } from 'vitest';
import {
  formatEventDateBadge,
  formatTime12h,
  formatTimeRange,
  selectNextUpcomingEvent,
} from './eventsDisplay';

describe('selectNextUpcomingEvent', () => {
  const events = [
    { id: 'past', start_date: '2026-06-01', end_date: '2026-06-02' },
    { id: 'endsToday', start_date: '2026-07-14', end_date: '2026-07-16' },
    { id: 'future', start_date: '2026-08-01', end_date: null },
  ];

  it('picks the soonest event that has not finished yet', () => {
    expect(selectNextUpcomingEvent(events, '2026-07-16')?.id).toBe('endsToday');
  });

  it('an in-progress multi-day event still counts as upcoming until its end date', () => {
    expect(selectNextUpcomingEvent(events, '2026-07-15')?.id).toBe('endsToday');
    expect(selectNextUpcomingEvent(events, '2026-07-17')?.id).toBe('future');
  });

  it('falls back to start_date when end_date is null and skips undated events', () => {
    expect(selectNextUpcomingEvent([{ start_date: null, end_date: null }], '2026-07-16')).toBeNull();
    expect(selectNextUpcomingEvent([{ start_date: '2026-08-01', end_date: null }], '2026-08-01')).not.toBeNull();
  });

  it('returns null for empty/undefined lists or when everything is past', () => {
    expect(selectNextUpcomingEvent([], '2026-07-16')).toBeNull();
    expect(selectNextUpcomingEvent(undefined, '2026-07-16')).toBeNull();
    expect(selectNextUpcomingEvent(events, '2027-01-01')).toBeNull();
  });
});

describe('formatEventDateBadge', () => {
  it('formats Spanish month + weekday (2025-11-15 is a Saturday)', () => {
    expect(formatEventDateBadge('2025-11-15')).toEqual({
      day: '15',
      month: 'NOV',
      weekday: 'SÁBADO',
    });
  });

  it('supports English and strips leading zeros from the day', () => {
    expect(formatEventDateBadge('2026-07-05', 'en')).toEqual({
      day: '5',
      month: 'JUL',
      weekday: 'SUNDAY',
    });
  });

  it('returns null for missing or malformed dates', () => {
    expect(formatEventDateBadge(null)).toBeNull();
    expect(formatEventDateBadge('15/11/2025')).toBeNull();
  });
});

describe('formatTime12h / formatTimeRange', () => {
  it('formats Postgres time strings to 12-hour clock', () => {
    expect(formatTime12h('09:00:00')).toBe('9:00 AM');
    expect(formatTime12h('16:00:00')).toBe('4:00 PM');
    expect(formatTime12h('00:30')).toBe('12:30 AM');
    expect(formatTime12h('12:00:00')).toBe('12:00 PM');
  });

  it('builds the range only when both ends parse', () => {
    expect(formatTimeRange('09:00:00', '16:00:00')).toBe('9:00 AM - 4:00 PM');
    expect(formatTimeRange('09:00:00', null)).toBeNull();
    expect(formatTimeRange(null, null)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(formatTime12h('25:00')).toBeNull();
    expect(formatTime12h('noon')).toBeNull();
  });
});
