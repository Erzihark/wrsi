import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchSelect } from '@wrsi/ui';

interface CountryOption {
  id: string;
  name: string;
  name_es: string | null;
}

interface StateOption {
  id: string;
  name: string;
  country_id: string | null;
}

export interface CountryStateSelectProps {
  countries: CountryOption[];
  states: StateOption[];
  /** The persisted state/province id — the only value the parent stores. */
  value: string | null;
  onChange: (stateProvinceId: string | null) => void;
}

/**
 * Cascading Country → State/Province picker. The parent persists only the
 * state/province id; the country is UI-only, derived from the current state and
 * used to scope the state list. Changing the country clears the chosen state.
 *
 * `states` must already be loaded when this mounts (callers gate on it), so the
 * initial country can be derived synchronously from the persisted state.
 */
export function CountryStateSelect({
  countries,
  states,
  value,
  onChange,
}: CountryStateSelectProps) {
  const { t, i18n } = useTranslation();
  const spanish = i18n.language.startsWith('es');

  const [countryId, setCountryId] = useState<string | null>(
    () => states.find((s) => s.id === value)?.country_id ?? null,
  );

  const countryOptions = useMemo(
    () =>
      countries
        .map((c) => ({ label: spanish ? c.name_es ?? c.name : c.name, value: c.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries, spanish],
  );

  // State/province options are scoped to the chosen country (cascading select).
  const stateOptions = useMemo(
    () =>
      states
        .filter((s) => countryId != null && s.country_id === countryId)
        .map((s) => ({ label: s.name, value: s.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [states, countryId],
  );

  // Changing the country invalidates any state picked under the previous one.
  function onCountryChange(next: string) {
    setCountryId(next);
    onChange(null);
  }

  return (
    <>
      <SearchSelect
        label={t('admin.country')}
        options={countryOptions}
        value={countryId}
        onChange={onCountryChange}
        placeholder={t('picker.select')}
        searchPlaceholder={t('picker.search')}
        noResultsText={t('picker.noResults')}
      />
      {countryId && stateOptions.length > 0 ? (
        <SearchSelect
          label={t('admin.state')}
          options={stateOptions}
          value={value}
          onChange={onChange}
          placeholder={t('picker.select')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
      ) : null}
    </>
  );
}
