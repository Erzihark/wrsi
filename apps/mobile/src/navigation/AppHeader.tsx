import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
  type EdgeInsets,
} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from '@wrsi/ui';
import { useAuth } from '../auth/AuthContext';

/**
 * Top app bar for the staff experiences (admin, counselor) and for the student
 * onboarding wizard. Carries the brand and the single global Log-out action, so
 * logging out never depends on which nested screen you're on.
 *
 * Onboarded students do NOT get this header — they get the designed
 * `StudentHeader` (logo + notifications + profile), and their Log out lives on
 * the profile screen instead.
 *
 * It consumes the top safe-area inset itself; `AppHeaderShell` zeroes the top
 * inset for the navigator below so screens' own headers don't double-pad.
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
          <Text style={{ color: theme.color.brand, fontWeight: theme.fontWeight.semibold }}>
            {t('auth.logout')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Wraps content in the `AppHeader` and zeroes the top safe-area inset for it,
 * since the header already consumed that space. Used by the staff navigators
 * and the student onboarding wizard.
 */
export function AppHeaderShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      <AppHeader />
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <SafeAreaInsetsContext.Provider value={{ ...(insets as EdgeInsets), top: 0 }}>
            <View style={{ flex: 1 }}>{children}</View>
          </SafeAreaInsetsContext.Provider>
        )}
      </SafeAreaInsetsContext.Consumer>
    </View>
  );
}
