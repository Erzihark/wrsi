import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import type { Option } from './Select';

/** Accent-insensitive, case-insensitive match for search filtering. */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

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
}

/**
 * Full-screen searchable option picker. The user can only choose from the
 * provided options — typing filters, it never produces a free-text value.
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
}: OptionPickerModalProps<T>) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query]);

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
          data={filtered}
          keyExtractor={(item) => String(item.value)}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: t.color.border }} />
          )}
          ListEmptyComponent={
            <Text variant="muted" style={{ paddingVertical: t.spacing.lg }}>
              {noResultsText}
            </Text>
          }
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.value);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(item.value);
                  if (!multi) close();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: t.spacing.md,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: isSelected ? t.color.primary : t.color.text,
                    fontWeight: isSelected ? t.fontWeight.semibold : t.fontWeight.regular,
                  }}
                >
                  {item.label}
                </Text>
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
