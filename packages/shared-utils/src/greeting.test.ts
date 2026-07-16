import { describe, expect, it } from 'vitest';
import { timeOfDayKey } from './greeting';

describe('timeOfDayKey', () => {
  it('buckets hours into morning / afternoon / evening', () => {
    expect(timeOfDayKey(5)).toBe('morning');
    expect(timeOfDayKey(11)).toBe('morning');
    expect(timeOfDayKey(12)).toBe('afternoon');
    expect(timeOfDayKey(18)).toBe('afternoon');
    expect(timeOfDayKey(19)).toBe('evening');
    expect(timeOfDayKey(23)).toBe('evening');
    expect(timeOfDayKey(0)).toBe('evening');
    expect(timeOfDayKey(4)).toBe('evening');
  });
});
