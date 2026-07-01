import { useTranslation } from 'react-i18next';
import { Screen, Text } from '@wrsi/ui';

export function DocumentsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="heading">{t('student.documents')}</Text>
      <Text variant="muted">{t('student.nextSteps')}</Text>
    </Screen>
  );
}
