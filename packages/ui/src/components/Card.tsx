import { View, type ViewProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Card({ style, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.color.surface,
          borderRadius: t.radius.lg,
          padding: t.spacing.lg,
          borderWidth: 1,
          borderColor: t.color.border,
          gap: t.spacing.sm,
        },
        style,
      ]}
      {...rest}
    />
  );
}
