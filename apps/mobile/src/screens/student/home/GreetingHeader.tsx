import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { timeOfDayKey } from '@wrsi/shared-utils';
import { Text } from '@wrsi/ui';

/** "¡Hola, Alejandro! 👋" + a time-of-day subtitle ("Buenas tardes."). */
export function GreetingHeader({ firstName }: { firstName: string }) {
  const { t } = useTranslation();
  const key = timeOfDayKey(new Date().getHours());

  return (
    <View style={{ gap: 2 }}>
      <Text variant="heading" testID="student-home-greeting">
        {t('home.greeting', { name: firstName })}
      </Text>
      <Text variant="muted">{t(`home.timeOfDay.${key}`)}</Text>
    </View>
  );
}
