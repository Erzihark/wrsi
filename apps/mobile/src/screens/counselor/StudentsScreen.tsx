import { useTranslation } from 'react-i18next';
import { Screen, Text, Card, Button } from '@wrsi/ui';
import { useAuth } from '../../auth/AuthContext';

export function StudentsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  return (
    <Screen scroll>
      <Text variant="heading">{t('counselor.students')}</Text>
      <Card>
        <Text variant="title">{t('counselor.search')}</Text>
        <Text variant="muted">CRM single-pane-of-glass — coming next.</Text>
      </Card>
      <Button variant="secondary" title={t('auth.logout')} onPress={signOut} />
    </Screen>
  );
}
