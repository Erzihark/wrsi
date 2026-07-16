import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface IconTileProps {
  /** Renders the icon at the given color (matches the Button `icon` convention). */
  icon: (color: string) => ReactNode;
  label: string;
  onPress?: () => void;
  /** Icon + tint color; defaults to the brand primary. */
  color?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A quick-access tile: a tinted rounded square holding an icon, with a label
 * beneath. Used for the dashboard "Accesos rápidos" grid.
 */
export function IconTile({ icon, label, onPress, color, testID, style }: IconTileProps) {
  const t = useTheme();
  const tint = color ?? t.color.primary;

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [{ alignItems: 'center', gap: t.spacing.xs, opacity: pressed ? 0.7 : 1 }, style]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: t.radius.lg,
          backgroundColor: t.color.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon(tint)}
      </View>
      <Text
        variant="label"
        numberOfLines={2}
        style={{ textAlign: 'center' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
