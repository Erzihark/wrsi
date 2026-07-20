import { describe, expect, it } from 'vitest';
import {
  PRIORITY_COUNTRY_ISOS,
  countryDisplayName,
  countrySearchKeywords,
  priorityCountryIds,
  type CountryLike,
} from './countries';

const MX: CountryLike = {
  id: 'id-mx',
  name: 'Mexico',
  name_es: 'México',
  iso_code: 'MX',
  calling_code: '+52',
};
const US: CountryLike = {
  id: 'id-us',
  name: 'United States',
  name_es: 'Estados Unidos',
  iso_code: 'US',
  calling_code: '+1',
};
const DE: CountryLike = {
  id: 'id-de',
  name: 'Germany',
  name_es: 'Alemania',
  iso_code: 'DE',
  calling_code: '+49',
};

describe('priorityCountryIds', () => {
  it('returns the priority ids in PRIORITY_COUNTRY_ISOS order, not row order', () => {
    // Rows arrive alphabetically (US before MX is not the order we want).
    expect(priorityCountryIds([DE, US, MX])).toEqual(['id-mx', 'id-us']);
  });

  it('skips priority codes with no matching row', () => {
    expect(priorityCountryIds([DE, MX])).toEqual(['id-mx']);
    expect(priorityCountryIds([DE])).toEqual([]);
  });

  it('matches iso codes case-insensitively', () => {
    expect(priorityCountryIds([{ ...MX, iso_code: 'mx' }])).toEqual(['id-mx']);
    expect(priorityCountryIds([MX], ['mx'])).toEqual(['id-mx']);
  });

  it('keeps the first row when an iso code is duplicated', () => {
    expect(priorityCountryIds([MX, { ...MX, id: 'dupe' }])).toEqual(['id-mx']);
  });

  it('accepts a custom priority list', () => {
    expect(priorityCountryIds([MX, US, DE], ['DE', 'US'])).toEqual(['id-de', 'id-us']);
  });

  it('returns an empty list for empty inputs', () => {
    expect(priorityCountryIds([])).toEqual([]);
    expect(priorityCountryIds([MX], [])).toEqual([]);
  });

  it('pins Mexico ahead of the US by default', () => {
    expect(PRIORITY_COUNTRY_ISOS).toEqual(['MX', 'US']);
  });
});

describe('countryDisplayName', () => {
  it('uses the Spanish name when asked and available', () => {
    expect(countryDisplayName(MX, true)).toBe('México');
    expect(countryDisplayName(MX, false)).toBe('Mexico');
  });

  it('falls back to the English name when name_es is missing', () => {
    expect(countryDisplayName({ ...MX, name_es: null }, true)).toBe('Mexico');
    expect(countryDisplayName({ id: 'x', name: 'Palau', iso_code: 'PW' }, true)).toBe('Palau');
  });
});

describe('countrySearchKeywords', () => {
  it('includes both names, the iso code and the dial code with and without "+"', () => {
    expect(countrySearchKeywords(MX)).toEqual(['Mexico', 'México', 'MX', '+52', '52']);
  });

  it('drops missing fields rather than emitting empty terms', () => {
    expect(countrySearchKeywords({ id: 'x', name: 'Palau', iso_code: 'PW' })).toEqual([
      'Palau',
      'PW',
    ]);
  });
});
