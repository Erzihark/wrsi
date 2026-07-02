import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Selectable pill used by Select / MultiSelect and available for tags. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: t.spacing.md,
        paddingVertical: t.spacing.sm,
        borderRadius: t.radius.pill,
        borderWidth: 1,
        borderColor: selected ? t.color.primary : t.color.border,
        backgroundColor: selected ? `${t.color.primary}22` : t.color.background,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          color: selected ? t.color.primary : t.color.text,
          fontSize: t.fontSize.sm,
          fontWeight: selected ? t.fontWeight.semibold : t.fontWeight.regular,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
