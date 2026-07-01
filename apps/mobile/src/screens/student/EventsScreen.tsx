import { useTranslation } from 'react-i18next';
import { Screen, Text } from '@wrsi/ui';

export function EventsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="heading">{t('student.events')}</Text>
      <Text variant="muted">{t('student.nextSteps')}</Text>
    </Screen>
  );
}
