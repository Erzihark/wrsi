import { ScrollView, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Pressable } from 'react-native';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
  /** Optional count rendered after the label, as in "Solicitados (3)". */
  count?: number;
}

export interface SegmentedTabsProps<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (next: T) => void;
  testID?: string;
  style?: ViewStyle;
}

/**
 * The designed pill tab bar — "Mi ranking / Todas (32)", "Disponibles /
 * Solicitados (3) / Aprobados (2)".
 *
 * Horizontally scrollable rather than equal-width columns: Spanish labels with
 * a count ("Solicitados (4)" is 15 characters) do not fit three-across on a
 * 360px screen, and squeezing them would push the type under the 14px floor.
 * Scrolling keeps every label at full size and readable; with two short tabs
 * the row simply never scrolls.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  testID,
  style,
}: SegmentedTabsProps<T>) {
  const t = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      style={[{ flexGrow: 0 }, style]}
      contentContainerStyle={{
        gap: t.spacing.sm,
        padding: t.spacing.xs,
        backgroundColor: t.color.surfaceAlt,
        borderRadius: t.radius.pill,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={testID ? `${testID}-${option.value}` : undefined}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              paddingHorizontal: t.spacing.lg,
              paddingVertical: t.spacing.sm,
              borderRadius: t.radius.pill,
              backgroundColor: selected ? t.color.brand : 'transparent',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  color: selected ? t.color.textOnDark : t.color.text,
                  fontSize: t.fontSize.sm,
                  fontWeight: selected ? t.fontWeight.semibold : t.fontWeight.medium,
                }}
              >
                {option.count == null ? option.label : `${option.label} (${option.count})`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
