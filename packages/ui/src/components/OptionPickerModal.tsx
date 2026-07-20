import { useMemo, useState, type ReactNode } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildPickerRows, filterOptions } from '@wrsi/shared-utils';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import type { Option } from './Select';

export interface OptionPickerModalProps<T extends string | number> {
  visible: boolean;
  title?: string;
  options: Option<T>[];
  /** Currently selected value(s) — used to render checkmarks. */
  selected: T[];
  onSelect: (value: T) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  noResultsText?: string;
  doneText?: string;
  /** Multi-select keeps the modal open on selection and shows a Done button. */
  multi?: boolean;
  /** Optional leading content per row (e.g. a flag), rendered before the label. */
  renderLeading?: (value: T) => ReactNode;
  /**
   * "Quick selection" values pinned above the full list, in the order given.
   * They are moved into the pinned group (not duplicated), and values absent
   * from `options` are ignored.
   */
  pinnedValues?: readonly T[];
  /** Heading over the pinned group. */
  pinnedLabel?: string;
  /** Heading over the remaining options, shown only when a pinned group exists. */
  allLabel?: string;
}

/**
 * Full-screen searchable option picker. The user can only choose from the
 * provided options — typing filters, it never produces a free-text value.
 *
 * Long lists (countries especially) can pin a "quick selection" group above the
 * rest via `pinnedValues`; the grouping survives filtering, so searching still
 * shows a pinned match under its own heading.
 */
export function OptionPickerModal<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  searchPlaceholder = 'Search…',
  noResultsText = 'No results',
  doneText = 'Done',
  multi = false,
  renderLeading,
  pinnedValues,
  pinnedLabel = 'Most used',
  allLabel = 'All',
}: OptionPickerModalProps<T>) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const rows = useMemo(
    () =>
      buildPickerRows(filterOptions(options, query), { pinnedValues, pinnedLabel, allLabel }),
    [options, query, pinnedValues, pinnedLabel, allLabel],
  );

  function close() {
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View
        style={{
          flex: 1,
          backgroundColor: t.color.background,
          paddingTop: insets.top + t.spacing.md,
          paddingBottom: insets.bottom,
          paddingHorizontal: t.spacing.lg,
          gap: t.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          <View style={{ flex: 1 }}>
            {title ? <Text variant="title">{title}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" onPress={close} hitSlop={12}>
            <Text style={{ color: t.color.primary, fontWeight: t.fontWeight.semibold }}>
              {multi ? doneText : '✕'}
            </Text>
          </Pressable>
        </View>

        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={t.color.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            borderWidth: 1,
            borderColor: t.color.border,
            borderRadius: t.radius.md,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
            fontSize: t.fontSize.md,
            color: t.color.text,
          }}
        />

        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text variant="muted" style={{ paddingVertical: t.spacing.lg }}>
              {noResultsText}
            </Text>
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <Text
                  variant="muted"
                  // Stable, language-independent hooks for Maestro flows.
                  testID={item.key === '__pinned' ? 'picker-section-pinned' : 'picker-section-all'}
                  style={{
                    paddingTop: t.spacing.lg,
                    paddingBottom: t.spacing.xs,
                    fontSize: t.fontSize.xs,
                    fontWeight: t.fontWeight.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {item.label}
                </Text>
              );
            }

            const { option } = item;
            const isSelected = selected.includes(option.value);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(option.value);
                  if (!multi) close();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: t.spacing.sm,
                  paddingVertical: t.spacing.md,
                  // Drawn on the row (not as a FlatList separator) so group
                  // headings don't get a stray rule above them.
                  borderTopWidth: item.divider ? 1 : 0,
                  borderTopColor: t.color.border,
                  opacity: pressed ? 0.7 : 1,
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
                  {renderLeading ? renderLeading(option.value) : null}
                  <Text
                    style={{
                      flexShrink: 1,
                      color: isSelected ? t.color.primary : t.color.text,
                      fontWeight: isSelected ? t.fontWeight.semibold : t.fontWeight.regular,
                    }}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected ? (
                  <Text style={{ color: t.color.primary, fontWeight: t.fontWeight.bold }}>✓</Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}
