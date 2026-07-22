import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/**
 * Named badge treatments. Each pairs an AA-readable foreground with its own
 * tint, so callers never have to know which shade of a brand color is safe on
 * small text (`primary`/`accent` at full strength are not).
 */
export type BadgeTone = 'accent' | 'primary' | 'brand' | 'success' | 'danger' | 'neutral';

export interface BadgeProps {
  label: string;
  /** Semantic treatment. Defaults to `accent` (amber) — the brand's badge color. */
  tone?: BadgeTone;
  /**
   * Escape hatch for badges whose color comes from data (a DB-configured status
   * color). 6-digit hex, used as the text color over a translucent tint of
   * itself. Overrides `tone`.
   */
  color?: string;
}

export function Badge({ label, tone = 'accent', color }: BadgeProps) {
  const t = useTheme();
  const tones: Record<BadgeTone, { fg: string; bg: string }> = {
    accent: { fg: t.color.accentDark, bg: t.color.accentSoft },
    primary: { fg: t.color.primaryDark, bg: t.color.primarySoft },
    brand: { fg: t.color.brand, bg: t.color.brandSoft },
    success: { fg: t.color.success, bg: t.color.successSoft },
    danger: { fg: t.color.danger, bg: t.color.dangerSoft },
    neutral: { fg: t.color.textMuted, bg: t.color.surfaceAlt },
  };
  const { fg, bg } = color ? { fg: color, bg: `${color}22` } : tones[tone];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderRadius: t.radius.pill,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xs,
      }}
    >
      <Text style={{ color: fg, fontSize: t.fontSize.xs, fontWeight: t.fontWeight.medium }}>
        {label}
      </Text>
    </View>
  );
}
