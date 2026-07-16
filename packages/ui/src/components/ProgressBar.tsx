import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface ProgressBarProps {
  /** Fraction filled, 0..1 (clamped). */
  value: number;
  /** Bar thickness in px. */
  height?: number;
  /** Fill color; defaults to the brand primary. */
  color?: string;
  /** Track (unfilled) color; defaults to a soft brand tint. */
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** A rounded horizontal progress bar (the "Tu viaje WRSI" journey bar). */
export function ProgressBar({ value, height = 8, color, trackColor, style }: ProgressBarProps) {
  const t = useTheme();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: pct, min: 0, max: 100 }}
      style={[
        {
          height,
          borderRadius: t.radius.pill,
          backgroundColor: trackColor ?? t.color.primarySoft,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: t.radius.pill,
          backgroundColor: color ?? t.color.primary,
        }}
      />
    </View>
  );
}
