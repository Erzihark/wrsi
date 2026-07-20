import { describe, expect, it } from 'vitest';
import {
  buildPickerRows,
  filterOptions,
  normalizeSearchText,
  partitionPinned,
  type PickerOption,
} from './pickerOptions';

const options: PickerOption[] = [
  { label: 'Alemania (+49)', value: 'de', keywords: ['Germany', 'DE', '+49', '49'] },
  { label: 'Estados Unidos (+1)', value: 'us', keywords: ['United States', 'US', '+1', '1'] },
  { label: 'México (+52)', value: 'mx', keywords: ['Mexico', 'MX', '+52', '52'] },
];

const values = (list: PickerOption[]) => list.map((o) => o.value);

describe('normalizeSearchText', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeSearchText('MÉXICO')).toBe('mexico');
  });
});

describe('filterOptions', () => {
  it('returns the same array reference for a blank query', () => {
    expect(filterOptions(options, '')).toBe(options);
    expect(filterOptions(options, '   ')).toBe(options);
  });

  it('matches the label ignoring accents and case', () => {
    expect(values(filterOptions(options, 'mexico'))).toEqual(['mx']);
    expect(values(filterOptions(options, 'MÉX'))).toEqual(['mx']);
  });

  it('matches the other-language name via keywords', () => {
    expect(values(filterOptions(options, 'germany'))).toEqual(['de']);
  });

  it('matches the iso code and the dial code with or without "+"', () => {
    expect(values(filterOptions(options, 'mx'))).toEqual(['mx']);
    expect(values(filterOptions(options, '+52'))).toEqual(['mx']);
    expect(values(filterOptions(options, '49'))).toEqual(['de']);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterOptions(options, 'zzz')).toEqual([]);
  });

  it('tolerates options with no keywords', () => {
    const plain = [{ label: 'Plain', value: 'p' }];
    expect(values(filterOptions(plain, 'plain'))).toEqual(['p']);
    expect(filterOptions(plain, 'nope')).toEqual([]);
  });
});

describe('partitionPinned', () => {
  it('pulls pinned options out in pinnedValues order', () => {
    const { pinned, rest } = partitionPinned(options, ['mx', 'us']);
    expect(values(pinned)).toEqual(['mx', 'us']);
    expect(values(rest)).toEqual(['de']);
  });

  it('leaves the rest in the caller-supplied order', () => {
    const { rest } = partitionPinned(options, ['mx']);
    expect(values(rest)).toEqual(['de', 'us']);
  });

  it('ignores pinned values that are not in the option list', () => {
    const { pinned, rest } = partitionPinned(options, ['mx', 'ghost']);
    expect(values(pinned)).toEqual(['mx']);
    expect(values(rest)).toEqual(['de', 'us']);
  });

  it('returns everything as rest when nothing is pinned', () => {
    expect(partitionPinned(options)).toEqual({ pinned: [], rest: options });
    expect(partitionPinned(options, [])).toEqual({ pinned: [], rest: options });
  });

  it('never duplicates an option across the two groups', () => {
    const { pinned, rest } = partitionPinned(options, ['mx', 'us', 'de']);
    expect(values(pinned)).toEqual(['mx', 'us', 'de']);
    expect(rest).toEqual([]);
  });
});

describe('buildPickerRows', () => {
  const labels = { pinnedLabel: 'Most used', allLabel: 'All countries' };
  /** Compact shape for asserting on a whole list: 'header:Label' or 'value' / '—value'. */
  const shape = (rows: ReturnType<typeof buildPickerRows<string, PickerOption>>) =>
    rows.map((r) =>
      r.kind === 'header' ? `header:${r.label}` : `${r.divider ? '—' : ''}${r.option.value}`,
    );

  it('puts the pinned group under its heading, then the rest under theirs', () => {
    expect(shape(buildPickerRows(options, { ...labels, pinnedValues: ['mx', 'us'] }))).toEqual([
      'header:Most used',
      'mx',
      '—us',
      'header:All countries',
      'de',
    ]);
  });

  it('restarts the divider run in each group, so no rule sits under a heading', () => {
    const rows = buildPickerRows(options, { ...labels, pinnedValues: ['mx'] });
    // The first row after each heading must not draw a divider.
    rows.forEach((row, i) => {
      const prev = rows[i - 1];
      if (row.kind === 'option' && (!prev || prev.kind === 'header')) {
        expect(row.divider).toBe(false);
      }
    });
  });

  it('omits headings entirely when nothing is pinned', () => {
    expect(shape(buildPickerRows(options, labels))).toEqual(['de', '—us', '—mx']);
  });

  it('omits headings when every option is pinned — one group needs no label', () => {
    expect(
      shape(buildPickerRows(options, { ...labels, pinnedValues: ['mx', 'us', 'de'] })),
    ).toEqual(['mx', '—us', '—de']);
  });

  it('omits headings when a search narrows the list to the pinned group only', () => {
    // What the user sees after typing "mex": one row, no "Most used" heading.
    const matches = filterOptions(options, 'mex');
    expect(shape(buildPickerRows(matches, { ...labels, pinnedValues: ['mx', 'us'] }))).toEqual([
      'mx',
    ]);
  });

  it('keeps headings when a search still straddles both groups', () => {
    // "a" hits Alemania and Estados Unidos, but not México — one per group.
    const matches = filterOptions(options, 'a');
    expect(shape(buildPickerRows(matches, { ...labels, pinnedValues: ['us'] }))).toEqual([
      'header:Most used',
      'us',
      'header:All countries',
      'de',
    ]);
  });

  it('returns no rows for an empty option list', () => {
    expect(buildPickerRows([], { ...labels, pinnedValues: ['mx'] })).toEqual([]);
  });
});
