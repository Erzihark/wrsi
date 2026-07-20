import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckIcon, ChevronRightIcon, InfoIcon, Text, useTheme } from '@wrsi/ui';

export interface ProfileRowProps {
  icon: (color: string) => ReactNode;
  label: string;
  /** The stored value, or a placeholder when there's nothing yet. */
  value?: string | null;
  complete: boolean;
  onPress?: () => void;
  testID?: string;
}

/**
 * One row of the profile screen: icon, label, current value, and a
 * Completado/Pendiente pill. Pressing it opens the edit form focused on this
 * field. Rows without `onPress` (e.g. email, which is the auth identity and
 * can't be changed here) render without a chevron.
 */
export function ProfileRow({ icon, label, value, complete, onPress, testID }: ProfileRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const statusColor = complete ? theme.color.success : theme.color.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {icon(theme.color.textMuted)}

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{label}</Text>
        <Text variant="muted" numberOfLines={2}>
          {value?.trim() ? value : t('profile.notProvided')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        {complete ? (
          <CheckIcon size={14} color={statusColor} />
        ) : (
          <InfoIcon size={14} color={statusColor} />
        )}
        <Text style={{ color: statusColor, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium }}>
          {complete ? t('profile.complete') : t('profile.pending')}
        </Text>
        {onPress ? <ChevronRightIcon size={16} color={theme.color.textMuted} /> : null}
      </View>
    </Pressable>
  );
}

/** A titled group of rows ("Información personal" / "Información académica"). */
export function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="title">{title}</Text>
      <View
        style={{
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.color.border,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        {children}
      </View>
    </View>
  );
}
