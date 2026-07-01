import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Variant = 'body' | 'muted' | 'label' | 'title' | 'heading';

export interface TextProps extends RNTextProps {
  variant?: Variant;
}

export function Text({ variant = 'body', style, ...rest }: TextProps) {
  const t = useTheme();
  const base: TextStyle = { color: t.color.text, fontSize: t.fontSize.md };
  const variants: Record<Variant, TextStyle> = {
    body: {},
    muted: { color: t.color.textMuted, fontSize: t.fontSize.sm },
    label: { fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium },
    title: { fontSize: t.fontSize.lg, fontWeight: t.fontWeight.semibold },
    heading: { fontSize: t.fontSize.xl, fontWeight: t.fontWeight.bold },
  };
  return <RNText style={[base, variants[variant], style]} {...rest} />;
}
