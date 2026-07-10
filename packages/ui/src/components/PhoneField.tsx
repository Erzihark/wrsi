import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import {
  formatPhoneAsYouType,
  makePhoneValue,
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
}

/**
 * Combined dial-code + national-number input. The dropdown selects the country
 * (E.164 extension); the number is formatted as-you-type for the chosen country
 * and validated against that country's real numbering rules
 * (`libphonenumber-js`). Emits a {@link PhoneValue} carrying the composed E.164
 * string and a `isValid` flag the form's schema gates on.
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

  const dialOptions = useMemo(
    () =>
      countries
        .filter((c) => c.calling_code)
        .map((c) => ({
          value: c.id,
          label: `${(spanish ? c.name_es : null) ?? c.name} (${c.calling_code})`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries, spanish],
  );

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
          accessibilityRole="button"
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            borderWidth: 1,
            borderColor: error ? t.color.danger : t.color.border,
            borderRadius: t.radius.md,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
            backgroundColor: t.color.background,
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
            backgroundColor: t.color.background,
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
        renderLeading={(id) => {
          const flagIso = isoById.get(id);
          return flagIso ? <CountryFlag iso={flagIso} size={16} /> : null;
        }}
      />
    </View>
  );
}
