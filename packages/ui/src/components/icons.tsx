import Svg, { Circle, Path } from 'react-native-svg';

export interface IconProps {
  /** Square bounding-box size in px. */
  size?: number;
  /** Stroke/fill color. Callers pick the theme token that matches their context. */
  color: string;
}

/**
 * Small inline icons drawn with `react-native-svg` instead of Unicode glyphs.
 *
 * Characters that have an emoji variant (♥ U+2665, ℹ U+2139, flag pairs, …)
 * are unreliable in UI text: Android's font fallback routes them to the color
 * emoji font on many devices, which ignores `color` and looks nothing like the
 * iOS rendering. Bundled SVGs render identically on both platforms — the same
 * approach as `CountryFlag`. (Text-presentation-only symbols like ✓ ✕ ▾ have
 * no emoji variant and stay safe to use in strings.)
 */

export function CheckIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function InfoIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Path d="M12 16v-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={12} cy={8} r={1.5} fill={color} />
    </Svg>
  );
}

export function HeartIcon({ size = 16, color, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
