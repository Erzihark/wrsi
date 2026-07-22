import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import {
  countryDisplayName,
  countrySearchKeywords,
  formatPhoneAsYouType,
  makePhoneValue,
  priorityCountryIds,
  type PhoneValue,
} from '@wrsi/shared-utils';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { CountryFlag } from './CountryFlag';
import { OptionPickerModal } from './OptionPickerModal';

/** Minimal country shape the field needs (subset of the `countries` row). */
export interface PhoneCountry {
  id: string;
  name: string;
  name_es?: string | null;
  calling_code: string | null;
  iso_code: string;
}

export interface PhoneFieldProps {
  label?: string;
  countries: PhoneCountry[];
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  error?: string;
  /** Show Spanish country names in the picker. */
  spanish?: boolean;
  placeholder?: string;
  countryPickerTitle?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  /** Heading over the pinned dial codes (Mexico, US) in the country picker. */
  pinnedLabel?: string;
  /** Heading over the remaining countries in the picker. */
  allLabel?: string;
  /** Hook for E2E flows — set on the button that opens the dial-code picker. */
  countryTestID?: string;
}

/**
 * Combined dial-code + national-number input. The dropdown selects the country
 * (E.164 extension); the number is formatted as-you-type for the chosen country
 * and validated against that country's real numbering rules
 * (`libphonenumber-js`). Emits a {@link PhoneValue} carrying the composed E.164
 * string and a `isValid` flag the form's schema gates on.
 *
 * The country picker pins the high-traffic dial codes (Mexico, US — see
 * `PRIORITY_COUNTRY_ISOS`) above the alphabetical list, and matches searches on
 * the ISO code and dial code too, so "+52", "52" and "MX" all find Mexico.
 */
export function PhoneField({
  label,
  countries,
  value,
  onChange,
  error,
  spanish = false,
  placeholder,
  countryPickerTitle,
  searchPlaceholder,
  noResultsText,
  pinnedLabel,
  allLabel,
  countryTestID,
}: PhoneFieldProps) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => countries.find((c) => c.id === value.countryId) ?? null,
    [countries, value.countryId],
  );
  const iso = selected?.iso_code ?? null;

  // id → ISO lookup so each picker row can render its flag without a linear scan.
  const isoById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of countries) m.set(c.id, c.iso_code);
    return m;
  }, [countries]);

  // Only countries with a dial code can be an extension; sorted by the label the
  // user actually reads (which follows the app language).
  const dialCountries = useMemo(() => countries.filter((c) => c.calling_code), [countries]);

  const dialOptions = useMemo(
    () =>
      dialCountries
        .map((c) => ({
          value: c.id,
          label: `${countryDisplayName(c, spanish)} (${c.calling_code})`,
          keywords: countrySearchKeywords(c),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [dialCountries, spanish],
  );

  // Quick selection: the countries that account for most numbers entered here.
  const pinnedIds = useMemo(() => priorityCountryIds(dialCountries), [dialCountries]);

  function pickCountry(id: string) {
    const next = countries.find((c) => c.id === id) ?? null;
    onChange(makePhoneValue(id, value.national, next?.iso_code ?? null));
  }

  function changeNumber(text: string) {
    onChange(makePhoneValue(value.countryId, text.replace(/\D/g, ''), iso));
  }

  const display = formatPhoneAsYouType(value.national, iso);

  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        <Pressable
          testID={countryTestID}
          accessibilityRole="button"
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            borderWidth: 1,
            borderColor: error ? t.color.danger : t.color.border,
            borderRadius: t.radius.md,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
            backgroundColor: t.color.surface,
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.xs,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {selected ? <CountryFlag iso={selected.iso_code} size={14} /> : null}
          <Text style={{ color: selected ? t.color.text : t.color.textMuted }}>
            {selected?.calling_code ?? '+—'}
          </Text>
          <Text style={{ color: t.color.textMuted }}>▾</Text>
        </Pressable>
        <TextInput
          keyboardType="phone-pad"
          placeholder={placeholder}
          placeholderTextColor={t.color.textMuted}
          value={display}
          onChangeText={changeNumber}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: error ? t.color.danger : t.color.border,
            borderRadius: t.radius.md,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
            fontSize: t.fontSize.md,
            color: t.color.text,
            backgroundColor: t.color.surface,
          }}
        />
      </View>
      {error ? (
        <Text variant="muted" style={{ color: t.color.danger }}>
          {error}
        </Text>
      ) : null}

      <OptionPickerModal
        visible={open}
        title={countryPickerTitle ?? label}
        options={dialOptions}
        selected={value.countryId == null ? [] : [value.countryId]}
        onSelect={pickCountry}
        onClose={() => setOpen(false)}
        searchPlaceholder={searchPlaceholder}
        noResultsText={noResultsText}
        pinnedValues={pinnedIds}
        pinnedLabel={pinnedLabel}
        allLabel={allLabel}
        renderLeading={(id) => {
          const flagIso = isoById.get(id);
          return flagIso ? <CountryFlag iso={flagIso} size={16} /> : null;
        }}
      />
    </View>
  );
}
