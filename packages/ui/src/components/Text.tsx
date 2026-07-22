import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Variant = 'body' | 'muted' | 'label' | 'title' | 'heading';

export interface TextProps extends RNTextProps {
  variant?: Variant;
}

export function Text({ variant = 'body', style, ...rest }: TextProps) {
  const t = useTheme();
  const base: TextStyle = { color: t.color.text, fontSize: t.fontSize.md };
  // Copy is the neutral gray; anything that reads as a heading (including row
  // labels) carries the brand navy, per "headers" in the brand brief.
  const variants: Record<Variant, TextStyle> = {
    body: {},
    muted: { color: t.color.textMuted, fontSize: t.fontSize.sm },
    label: {
      color: t.color.textStrong,
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.semibold,
    },
    title: {
      color: t.color.textStrong,
      fontSize: t.fontSize.lg,
      fontWeight: t.fontWeight.semibold,
    },
    heading: {
      color: t.color.textStrong,
      fontSize: t.fontSize.xl,
      fontWeight: t.fontWeight.bold,
    },
  };
  return <RNText style={[base, variants[variant], style]} {...rest} />;
}
