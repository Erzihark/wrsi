import type { ReactNode } from 'react';
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  /**
   * Optional leading icon (receives the same foreground color the title uses:
   * `primaryText` on primary/danger, `text` otherwise). Prefer an SVG icon over
   * a glyph inside `title` — glyphs with emoji variants break on Android.
   */
  icon?: (color: string) => ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary'
      ? t.color.primary
      : variant === 'danger'
        ? t.color.danger
        : variant === 'secondary'
          ? t.color.surface
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' ? t.color.primaryText : t.color.text;

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
          flexDirection: 'row',
          gap: t.spacing.xs,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderColor:
            variant === 'primary'
              ? t.color.primary
              : variant === 'danger'
                ? t.color.danger
                : t.color.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? icon(fg) : null}
          <Text style={{ color: fg, fontWeight: t.fontWeight.semibold }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
