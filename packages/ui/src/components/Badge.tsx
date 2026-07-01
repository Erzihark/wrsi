import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  /** 6-digit hex; used for text and a translucent background. Defaults to primary. */
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const t = useTheme();
  const c = color ?? t.color.primary;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: `${c}22`,
        borderRadius: t.radius.pill,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xs,
      }}
    >
      <Text style={{ color: c, fontSize: t.fontSize.xs, fontWeight: t.fontWeight.medium }}>
        {label}
      </Text>
    </View>
  );
}
