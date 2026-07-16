import type { ReactNode } from 'react';
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

// --- Line icons (stroke) -----------------------------------------------------
// Shared props for the outline set below: 1.75 stroke, rounded caps/joins, no
// fill — tuned to read cleanly at tab-bar and list-row sizes.
// `color` is accepted (call sites pass it for readability) but the child <Path>s
// reference the enclosing icon's `color` directly, so Line doesn't use it.
function Line({ size = 24, children }: { size?: number; color?: string; children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

const STROKE = 1.75;

export function HomeIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function BellIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M18 8a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14 18 8Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.3 20a2 2 0 0 0 3.4 0"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function PersonIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M4 20c0-3.3 3.6-5.5 8-5.5s8 2.2 8 5.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Line>
  );
}

export function ChevronRightIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function ArrowLeftIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M19 12H5m0 0 6 6m-6-6 6-6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function CalendarIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path
        d="M4 9h16M8 3v4M16 3v4"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Line>
  );
}

export function ClockIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M12 7v5l3.5 2"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function MapPinIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.5} stroke={color} strokeWidth={STROKE} />
    </Line>
  );
}

export function GraduationCapIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M12 4 2 9l10 5 10-5-10-5Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5M21 9v5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function FileTextIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M14 3v5h5M9 13h6M9 17h6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function FolderIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function CameraIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.8A1 1 0 0 1 9.5 4h5a1 1 0 0 1 .8.4L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.2} stroke={color} strokeWidth={STROKE} />
    </Line>
  );
}

export function PlayIcon({ size = 24, color, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 5.5v13l11-6.5-11-6.5Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function MailIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path
        d="m4 7.5 8 5 8-5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function UsersIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Circle cx={9} cy={8} r={3.5} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M2.5 20c0-3 2.9-5 6.5-5s6.5 2 6.5 5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M16 5.2A3.5 3.5 0 0 1 16 12M17.5 14.4c2.3.5 4 2 4 4.6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Line>
  );
}

export function BookIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M5 17a3 3 0 0 1 3-3h9"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function TargetIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={1.5} fill={color} />
    </Line>
  );
}

// --- Brand marks (solid fill; drawn to their own official silhouettes) -------
// These use `fill` (not stroke) so they read as recognizable logos. WhatsApp
// keeps its bubble+handset; the social marks are simplified glyphs.

export function WhatsAppIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M9 8.5c-.3 0-.6.1-.8.4-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.7 2.7 4.3 3.7 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-1.4-.7c-.2-.1-.4-.1-.6.1l-.6.8c-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.3-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5v-.4l-.7-1.6c-.1-.4-.3-.4-.5-.4H9Z"
        fill={color}
      />
    </Svg>
  );
}

export function ChatIcon({ size, color }: IconProps) {
  return (
    <Line size={size} color={color}>
      <Path
        d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Line>
  );
}

export function InstagramIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"
        stroke={color}
        strokeWidth={STROKE}
      />
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={STROKE} />
      <Circle cx={17.2} cy={6.8} r={1.2} fill={color} />
    </Svg>
  );
}

export function TikTokIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 4c.4 2.4 1.9 3.9 4.3 4.2v3c-1.6 0-3-.5-4.3-1.4v5.7A5.5 5.5 0 1 1 8.5 10v3a2.5 2.5 0 1 0 2.5 2.5V4H14Z"
        fill={color}
      />
    </Svg>
  );
}

export function LinkedInIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={STROKE}
      />
      <Path
        d="M8 10.5V17M8 7.6v.01M12 17v-3.2a1.8 1.8 0 0 1 3.6 0V17M12 17v-6.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function YouTubeIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8.5c0-1.4 1-2.5 2.3-2.6C7.4 5.7 9.6 5.6 12 5.6s4.6.1 6.7.3C20 6 21 7.1 21 8.5c.1 1 .1 2 .1 3s0 2-.1 3c0 1.4-1 2.5-2.3 2.6-2.1.2-4.3.3-6.7.3s-4.6-.1-6.7-.3C4 17 3 15.9 3 14.5c-.1-1-.1-2-.1-3s0-2 .1-3Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path d="M10.5 9.5v5l4.2-2.5-4.2-2.5Z" fill={color} />
    </Svg>
  );
}
