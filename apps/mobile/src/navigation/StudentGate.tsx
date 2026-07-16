import { ActivityIndicator, View } from 'react-native';
import { useMyStudentProfile } from '@wrsi/api';
import { useTheme } from '@wrsi/ui';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { AppHeaderShell } from './AppHeader';
import { StudentNavigator } from './StudentNavigator';

/**
 * Routes a signed-in student to onboarding until their profile is completed.
 *
 * The onboarding wizard keeps the staff `AppHeader` — it's the only way out
 * (Log out) before the tabs exist. Once onboarded, the student gets the designed
 * experience, whose own `StudentHeader` consumes the top inset and whose Log out
 * lives on the profile tab.
 */
export function StudentGate() {
  const t = useTheme();
  const { data, isLoading } = useMyStudentProfile();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.color.background,
        }}
      >
        <ActivityIndicator color={t.color.primary} />
      </View>
    );
  }

  if (!data || !data.onboarding_completed_at) {
    return (
      <AppHeaderShell>
        <OnboardingScreen />
      </AppHeaderShell>
    );
  }
  return <StudentNavigator />;
}
