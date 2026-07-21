import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CountryFlag, SearchSelect, SearchMultiSelect, type Option } from '@wrsi/ui';
import {
  countryDisplayName,
  countrySearchKeywords,
  priorityCountryIds,
  type CountryLike,
} from '@wrsi/shared-utils';

/** The `countries` lookup columns these pickers read. */
export type CountryRow = CountryLike;

interface CountryPickerConfig {
  options: Option<string>[];
  pinnedValues: string[];
  renderLeading: (id: string) => React.ReactNode;
  /** i18n'd picker chrome (search/empty/section headings). */
  labels: {
    placeholder: string;
    searchPlaceholder: string;
    noResultsText: string;
    doneText: string;
    pinnedLabel: string;
    allLabel: string;
  };
}

/**
 * Everything a country dropdown needs, derived once from the `countries` lookup:
 * alphabetical options labelled in the app language, the pinned "quick
 * selection" ids (Mexico, US), a flag renderer, and the i18n'd picker chrome.
 *
 * Exported for the rare screen that needs the parts rather than the whole
 * component (e.g. a filter sheet); prefer {@link CountrySelect} /
 * {@link CountryMultiSelect}.
 */
export function useCountryOptions(countries: CountryRow[]): CountryPickerConfig {
  const { t, i18n } = useTranslation();
  const spanish = i18n.language.startsWith('es');

  const options = useMemo(
    () =>
      countries
        .map((c) => ({
          value: c.id,
          label: countryDisplayName(c, spanish),
          keywords: countrySearchKeywords(c),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries, spanish],
  );

  const pinnedValues = useMemo(() => priorityCountryIds(countries), [countries]);

  // id → ISO so each row renders its flag without rescanning the country list.
  const isoById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of countries) m.set(c.id, c.iso_code);
    return m;
  }, [countries]);

  const renderLeading = useMemo(
    () => (id: string) => {
      const iso = isoById.get(id);
      return iso ? <CountryFlag iso={iso} size={16} /> : null;
    },
    [isoById],
  );

  return {
    options,
    pinnedValues,
    renderLeading,
    labels: {
      placeholder: t('picker.select'),
      searchPlaceholder: t('picker.search'),
      noResultsText: t('picker.noResults'),
      doneText: t('picker.done'),
      pinnedLabel: t('picker.frequent'),
      allLabel: t('picker.allCountries'),
    },
  };
}

export interface CountrySelectProps {
  label?: string;
  countries: CountryRow[];
  value: string | null;
  onChange: (countryId: string) => void;
  error?: string;
  /** Empty-state text; defaults to the generic "Select…". */
  placeholder?: string;
  /** Hook for E2E flows — set on the field that opens the picker. */
  testID?: string;
}

/**
 * Single-country dropdown. Shows flags, pins the quick-selection countries above
 * the alphabetical list, and matches searches on ISO/dial code and the name in
 * either language. Use this instead of a bare `SearchSelect` over countries so
 * every country picker in the app behaves identically.
 */
export function CountrySelect({
  label,
  countries,
  value,
  onChange,
  error,
  placeholder,
  testID,
}: CountrySelectProps) {
  const { options, pinnedValues, renderLeading, labels } = useCountryOptions(countries);
  return (
    <SearchSelect
      testID={testID}
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      pinnedValues={pinnedValues}
      renderLeading={renderLeading}
      placeholder={placeholder ?? labels.placeholder}
      searchPlaceholder={labels.searchPlaceholder}
      noResultsText={labels.noResultsText}
      pinnedLabel={labels.pinnedLabel}
      allLabel={labels.allLabel}
    />
  );
}

export interface CountryMultiSelectProps {
  label?: string;
  countries: CountryRow[];
  values: string[];
  onChange: (countryIds: string[]) => void;
  error?: string;
}

/** Multi-country dropdown (countries of interest) — same behavior as {@link CountrySelect}. */
export function CountryMultiSelect({
  label,
  countries,
  values,
  onChange,
  error,
}: CountryMultiSelectProps) {
  const { options, pinnedValues, renderLeading, labels } = useCountryOptions(countries);
  return (
    <SearchMultiSelect
      label={label}
      options={options}
      values={values}
      onChange={onChange}
      error={error}
      pinnedValues={pinnedValues}
      renderLeading={renderLeading}
      placeholder={labels.placeholder}
      searchPlaceholder={labels.searchPlaceholder}
      noResultsText={labels.noResultsText}
      doneText={labels.doneText}
      pinnedLabel={labels.pinnedLabel}
      allLabel={labels.allLabel}
    />
  );
}
