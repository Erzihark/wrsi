import { describe, expect, it } from 'vitest';
import {
  fullName,
  intakeTermLabel,
  intakeYearOptions,
  normalizeForDedup,
  sanitizeSearchTerm,
} from './index';

describe('normalizeForDedup', () => {
  it('trims, lowercases, and strips accents', () => {
    expect(normalizeForDedup('  José  ')).toBe('jose');
    expect(normalizeForDedup('MÜNCHEN')).toBe('munchen');
    expect(normalizeForDedup('Ángela Núñez')).toBe('angela nunez');
  });
});

describe('fullName', () => {
  it('joins first and last names', () => {
    expect(fullName('Lorem', 'Ipsum')).toBe('Lorem Ipsum');
  });

  it('skips empty / nullish parts', () => {
    expect(fullName('Lorem', null)).toBe('Lorem');
    expect(fullName(null, 'Ipsum')).toBe('Ipsum');
    expect(fullName('', 'Ipsum')).toBe('Ipsum');
    expect(fullName(null, null)).toBe('');
    expect(fullName(undefined, undefined)).toBe('');
  });
});

describe('intakeTermLabel', () => {
  it('maps each enum value to a human label', () => {
    expect(intakeTermLabel('fall')).toBe('Fall');
    expect(intakeTermLabel('winter')).toBe('Winter');
    expect(intakeTermLabel('spring_summer')).toBe('Spring / Summer');
  });
});

describe('intakeYearOptions', () => {
  it('returns the current year through +6 (7 entries)', () => {
    expect(intakeYearOptions(new Date('2026-01-15T00:00:00Z'))).toEqual([
      2026, 2027, 2028, 2029, 2030, 2031, 2032,
    ]);
  });
});

describe('sanitizeSearchTerm', () => {
  it('returns an empty string for nullish input', () => {
    expect(sanitizeSearchTerm()).toBe('');
    expect(sanitizeSearchTerm(null)).toBe('');
    expect(sanitizeSearchTerm(undefined)).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeSearchTerm('  hello  ')).toBe('hello');
  });

  it('strips PostgREST filter metacharacters ( ) , *', () => {
    expect(sanitizeSearchTerm('a(b),c*d')).toBe('abcd');
    // A crafted attempt to inject an or()-filter clause is defanged.
    expect(sanitizeSearchTerm('x,first_name.ilike.*')).toBe('xfirst_name.ilike.');
  });

  it('leaves ordinary (incl. accented) terms untouched', () => {
    expect(sanitizeSearchTerm('José Ipsum')).toBe('José Ipsum');
  });
});
