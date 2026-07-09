import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from '@wrsi/ui';
import { useAuth } from '../auth/AuthContext';

/**
 * Persistent top app bar shown above every signed-in experience (admin,
 * counselor, student). Carries the brand and the single global Log-out action,
 * so logging out never depends on which nested screen you're on. It consumes the
 * top safe-area inset itself; RootNavigator zeroes the top inset for the
 * navigator below so the screens' own headers don't double-pad.
 */
export function AppHeader() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: theme.color.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.color.border,
      }}
    >
      <View
        style={{
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <Text variant="title">WX Study</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void signOut()}>
          <Text style={{ color: theme.color.primary, fontWeight: theme.fontWeight.semibold }}>
            {t('auth.logout')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
