import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useUnreadNotificationsCount } from '@wrsi/api';
import { BellIcon, PersonIcon, Text, useTheme } from '@wrsi/ui';

export interface StudentHeaderProps {
  onBellPress: () => void;
  onProfilePress: () => void;
}

/**
 * The student's branded top bar: WRSI wordmark, a notifications bell carrying
 * the unread count, and a profile shortcut. Replaces the staff `AppHeader` for
 * onboarded students (which is why Log out moved onto the profile screen).
 *
 * Presentational: navigation is injected by the Home stack's `header` option,
 * which is handed a `navigation` object by the navigator. (That prop is React
 * Navigation's documented contract for custom headers; `useNavigation()` inside
 * a header isn't.)
 *
 * It consumes the top safe-area inset itself, matching AppHeader's contract.
 */
export function StudentHeader({ onBellPress, onProfilePress }: StudentHeaderProps) {
  const t = useTheme();
  const { t: translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const unread = useUnreadNotificationsCount();
  const count = unread.data ?? 0;

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: t.color.background,
      }}
    >
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: t.spacing.lg,
        }}
      >
        {/* Wordmark. The real logo lands with the brand asset drop; until then
            the type treatment carries the brand color. */}
        <Text
          style={{
            fontSize: t.fontSize.lg,
            fontWeight: t.fontWeight.bold,
            letterSpacing: 0.5,
            color: t.color.text,
          }}
        >
          WRSI
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('notifications.title')}
            testID="student-header-bell"
            hitSlop={8}
            onPress={onBellPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <BellIcon size={24} color={t.color.text} />
            {count > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  minWidth: 18,
                  height: 18,
                  borderRadius: t.radius.pill,
                  paddingHorizontal: 4,
                  backgroundColor: t.color.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  testID="student-header-bell-badge"
                  style={{
                    color: t.color.primaryText,
                    fontSize: 10,
                    fontWeight: t.fontWeight.bold,
                  }}
                >
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('student.profile')}
            testID="student-header-profile"
            hitSlop={8}
            onPress={onProfilePress}
            style={({ pressed }) => ({
              width: 34,
              height: 34,
              borderRadius: t.radius.pill,
              backgroundColor: t.color.surface,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <PersonIcon size={20} color={t.color.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
