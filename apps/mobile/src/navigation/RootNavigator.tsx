import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@wrsi/ui';
import { useAuth } from '../auth/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { StudentGate } from './StudentGate';
import { CounselorNavigator } from './CounselorNavigator';

/**
 * Root auth switch: shows a splash while resolving the session, then mounts the
 * navigator for the signed-in user's experience (staff CRM vs student).
 */
export function RootNavigator() {
  const { session, experience, loading } = useAuth();
  const t = useTheme();

  if (loading) {
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

  if (!session) return <AuthNavigator />;
  return experience === 'staff' ? <CounselorNavigator /> : <StudentGate />;
}
