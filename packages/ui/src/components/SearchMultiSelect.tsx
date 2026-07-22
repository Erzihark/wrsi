import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Chip } from './Chip';
import type { Option } from './Select';
import { OptionPickerModal } from './OptionPickerModal';

export interface SearchMultiSelectProps<T extends string | number> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  doneText?: string;
  options: Option<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  error?: string;
  /** "Quick selection" values pinned above the rest — see `OptionPickerModal`. */
  pinnedValues?: readonly T[];
  pinnedLabel?: string;
  allLabel?: string;
  /** Optional leading content per picker row (e.g. a country flag). */
  renderLeading?: (value: T) => ReactNode;
}

/**
 * Multi-choice field for long lists: tap to open a searchable picker where each
 * tap toggles an option; selections render as removable chips on the field.
 */
export function SearchMultiSelect<T extends string | number>({
  label,
  placeholder = 'Select…',
  searchPlaceholder,
  noResultsText,
  doneText,
  options,
  values,
  onChange,
  error,
  pinnedValues,
  pinnedLabel,
  allLabel,
  renderLeading,
}: SearchMultiSelectProps<T>) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((o) => values.includes(o.value)),
    [options, values],
  );

  function toggle(value: T) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          borderWidth: 1,
          borderColor: error ? t.color.danger : t.color.border,
          borderRadius: t.radius.md,
          paddingHorizontal: t.spacing.md,
          paddingVertical: t.spacing.md,
          backgroundColor: t.color.surface,
          opacity: pressed ? 0.8 : 1,
          gap: t.spacing.sm,
        })}
      >
        {selectedOptions.length === 0 ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: t.color.textMuted }}>{placeholder}</Text>
            <Text style={{ color: t.color.textMuted }}>▾</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {selectedOptions.map((o) => (
              <Chip
                key={String(o.value)}
                label={`${o.label} ✕`}
                selected
                onPress={() => toggle(o.value)}
              />
            ))}
          </View>
        )}
      </Pressable>
      {error ? (
        <Text variant="muted" style={{ color: t.color.danger }}>
          {error}
        </Text>
      ) : null}

      <OptionPickerModal
        multi
        visible={open}
        title={label}
        options={options}
        selected={values}
        onSelect={toggle}
        onClose={() => setOpen(false)}
        searchPlaceholder={searchPlaceholder}
        noResultsText={noResultsText}
        doneText={doneText}
        pinnedValues={pinnedValues}
        pinnedLabel={pinnedLabel}
        allLabel={allLabel}
        renderLeading={renderLeading}
      />
    </View>
  );
}
