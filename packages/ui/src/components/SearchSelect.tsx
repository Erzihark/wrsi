import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import type { Option } from './Select';
import { OptionPickerModal } from './OptionPickerModal';

export interface SearchSelectProps<T extends string | number> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  /** "Quick selection" values pinned above the rest — see `OptionPickerModal`. */
  pinnedValues?: readonly T[];
  pinnedLabel?: string;
  allLabel?: string;
  /** Optional leading content per picker row (e.g. a country flag). */
  renderLeading?: (value: T) => ReactNode;
  /** Hook for E2E flows — set on the field that opens the picker. */
  testID?: string;
}

/**
 * Single-choice field for long lists: tap to open a searchable full-screen
 * picker; typing filters the options and the user must pick one of them.
 */
export function SearchSelect<T extends string | number>({
  label,
  placeholder = 'Select…',
  searchPlaceholder,
  noResultsText,
  options,
  value,
  onChange,
  error,
  pinnedValues,
  pinnedLabel,
  allLabel,
  renderLeading,
  testID,
}: SearchSelectProps<T>) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? null,
    [options, value],
  );

  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <Pressable
        testID={testID}
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
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.sm,
          }}
        >
          {/* Mirror the picker row's leading content (e.g. flag) on the field. */}
          {renderLeading && value != null ? renderLeading(value) : null}
          <Text
            style={{ flexShrink: 1, color: selectedLabel ? t.color.text : t.color.textMuted }}
          >
            {selectedLabel ?? placeholder}
          </Text>
        </View>
        <Text style={{ color: t.color.textMuted }}>▾</Text>
      </Pressable>
      {error ? (
        <Text variant="muted" style={{ color: t.color.danger }}>
          {error}
        </Text>
      ) : null}

      <OptionPickerModal
        visible={open}
        title={label}
        options={options}
        selected={value == null ? [] : [value]}
        onSelect={onChange}
        onClose={() => setOpen(false)}
        searchPlaceholder={searchPlaceholder}
        noResultsText={noResultsText}
        pinnedValues={pinnedValues}
        pinnedLabel={pinnedLabel}
        allLabel={allLabel}
        renderLeading={renderLeading}
      />
    </View>
  );
}
