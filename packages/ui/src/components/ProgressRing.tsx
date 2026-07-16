import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export interface ProgressRingProps {
  /** Fraction filled, 0..1 (clamped). */
  value: number;
  /** Outer diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  strokeWidth?: number;
  /** Progress arc color; defaults to the brand primary. */
  color?: string;
  /** Track color; defaults to a soft brand tint. */
  trackColor?: string;
  /** Centered content (e.g. the percent text or an avatar). */
  children?: ReactNode;
}

/**
 * A circular progress ring with a centered content slot — the profile-completion
 * indicator ("68%" ring). The arc starts at 12 o'clock and fills clockwise.
 */
export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        // Rotate so the arc begins at the top and sweeps clockwise.
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor ?? t.color.primarySoft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color ?? t.color.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </Svg>
      {children}
    </View>
  );
}
