import { SvgXml } from 'react-native-svg';
import { hasFlag } from 'country-flag-icons';
import * as flags3x2 from 'country-flag-icons/string/3x2';

// The `string/3x2` entry exports one SVG string per ISO 3166-1 alpha-2 code.
// Importing the namespace bundles the flags into the app (offline, no network).
const FLAGS = flags3x2 as unknown as Record<string, string>;

export interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 country code (e.g. "MX"). Case-insensitive. */
  iso: string;
  /** Rendered height in px; width follows the flag's 3:2 aspect ratio. */
  size?: number;
}

/**
 * A country flag as a bundled SVG (`country-flag-icons` + `react-native-svg`) —
 * renders offline with no third-party request, crisp at any size. Renders
 * nothing for an unknown/empty code so callers don't need to guard.
 */
export function CountryFlag({ iso, size = 16 }: CountryFlagProps) {
  const code = iso?.toUpperCase();
  if (!code || !hasFlag(code)) return null;
  const xml = FLAGS[code];
  if (!xml) return null;
  return <SvgXml xml={xml} width={size * 1.5} height={size} />;
}
