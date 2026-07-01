import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary'
      ? t.color.primary
      : variant === 'secondary'
        ? t.color.surface
        : 'transparent';
  const fg = variant === 'primary' ? t.color.primaryText : t.color.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.lg,
          borderRadius: t.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderColor: variant === 'primary' ? t.color.primary : t.color.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: t.fontWeight.semibold }}>{title}</Text>
      )}
    </Pressable>
  );
}
