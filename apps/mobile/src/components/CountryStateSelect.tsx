import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchSelect } from '@wrsi/ui';
import { CountrySelect, type CountryRow } from './CountrySelect';

interface StateOption {
  id: string;
  name: string;
  country_id: string | null;
}

export interface CountryStateSelectProps {
  countries: CountryRow[];
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
  const { t } = useTranslation();

  const [countryId, setCountryId] = useState<string | null>(
    () => states.find((s) => s.id === value)?.country_id ?? null,
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
      <CountrySelect
        testID="country-select"
        label={t('admin.country')}
        countries={countries}
        value={countryId}
        onChange={onCountryChange}
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
