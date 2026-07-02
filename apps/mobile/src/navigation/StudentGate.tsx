import { ActivityIndicator, View } from 'react-native';
import { useMyStudentProfile } from '@wrsi/api';
import { useTheme } from '@wrsi/ui';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { StudentNavigator } from './StudentNavigator';

/** Routes a signed-in student to onboarding until their profile is completed. */
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
    return <OnboardingScreen />;
  }
  return <StudentNavigator />;
}
