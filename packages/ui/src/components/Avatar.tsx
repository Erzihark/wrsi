import type { ReactNode } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface AvatarProps {
  /** Remote photo URL; when absent, initials (or a neutral circle) are shown. */
  photoUrl?: string | null;
  /** Full name used to derive up-to-2-letter initials for the fallback. */
  name?: string | null;
  /** Diameter in px. */
  size?: number;
  /**
   * Corner badge (e.g. a camera or WhatsApp icon in a small circle). Rendered
   * bottom-right, overlapping the avatar edge.
   */
  badge?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

function initials(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]![0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? '' : '';
  return (first + last).toUpperCase();
}

/**
 * Circular profile image with an initials fallback (navy on a soft navy tint) and an
 * optional corner badge slot. Used for the student photo and counselor photo.
 */
export function Avatar({ photoUrl, name, size = 48, badge, style }: AvatarProps) {
  const t = useTheme();
  const label = initials(name);

  return (
    <View style={[{ width: size, height: size }, style]}>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.color.brandSoft }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: t.color.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: t.color.brand,
              fontSize: size * 0.4,
              fontWeight: t.fontWeight.semibold,
            }}
          >
            {label}
          </Text>
        </View>
      )}
      {badge ? (
        <View style={{ position: 'absolute', right: -2, bottom: -2 }}>{badge}</View>
      ) : null}
    </View>
  );
}
