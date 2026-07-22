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
  /**
   * `primary` is the orange CTA, `brand` the navy action button (the brand's
   * "botones principales"), `secondary` an outlined button on a white fill,
   * `ghost` text-only, `danger` destructive.
   */
  variant?: 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  /**
   * Optional leading icon (receives the same foreground color the title uses:
   * white on the filled variants, navy otherwise). Prefer an SVG icon over a
   * glyph inside `title` — glyphs with emoji variants break on Android.
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
  const filled: Partial<Record<NonNullable<ButtonProps['variant']>, string>> = {
    primary: t.color.primary,
    brand: t.color.brand,
    danger: t.color.danger,
  };
  const bg =
    filled[variant] ?? (variant === 'secondary' ? t.color.surface : 'transparent');
  // Outlined/ghost buttons read as navy actions; filled ones carry white.
  const fg = filled[variant] ? t.color.brandText : t.color.textStrong;

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
          borderColor: filled[variant] ?? t.color.border,
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
