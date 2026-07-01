import { useTranslation } from 'react-i18next';
import { useMyStudentProfile } from '@wrsi/api';
import { Screen, Text, Card, Button } from '@wrsi/ui';
import { fullName } from '@wrsi/shared-utils';
import { useAuth } from '../../auth/AuthContext';

export function DashboardScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { data: student, isLoading } = useMyStudentProfile();

  const displayName = student
    ? fullName(student.first_name, student.last_name)
    : (session?.user.email ?? '');

  return (
    <Screen scroll>
      <Text variant="heading">{t('student.dashboard')}</Text>
      <Card>
        <Text variant="title">{displayName}</Text>
        <Text variant="muted">
          {isLoading ? t('common.loading') : t('student.progress')}
        </Text>
      </Card>
      <Button variant="secondary" title={t('auth.logout')} onPress={signOut} />
    </Screen>
  );
}
