import { ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useEvents, useMyEventRegistrations, useMyStudentProfile, useToggleEventRegistration } from '@wrsi/api';
import { Badge, Button, Card, Screen, Text, useTheme } from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../navigation/types';

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  return end && end !== start ? `${start} – ${end}` : start;
}

export function EventsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentEventsStackParamList, 'EventsList'>>();
  const events = useEvents();
  const profile = useMyStudentProfile();
  const registrations = useMyEventRegistrations();
  const toggle = useToggleEventRegistration();

  const studentId = profile.data?.id;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Screen>
      <Text variant="heading">{t('student.events')}</Text>
      {events.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={events.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{t('events.empty')}</Text>}
          renderItem={({ item }) => {
            const registered = registrations.data?.has(item.id) ?? false;
            const isPast = (item.end_date ?? item.start_date ?? '') < today && Boolean(item.start_date);
            return (
              <Card style={{ gap: theme.spacing.sm }}>
                <Text variant="title" onPress={() => nav.navigate('EventDetail', { eventId: item.id })}>
                  {item.title}
                </Text>
                <Text variant="muted">
                  {[formatDateRange(item.start_date, item.end_date), item.location].filter(Boolean).join(' · ')}
                </Text>
                {isPast ? <Badge label={t('events.past')} color={theme.color.textMuted} /> : null}
                <Button
                  variant={registered ? 'primary' : 'secondary'}
                  title={registered ? t('events.registered') : t('events.register')}
                  loading={toggle.isPending}
                  disabled={!studentId || isPast}
                  onPress={() => {
                    if (studentId) toggle.mutate({ studentId, eventId: item.id, registered });
                  }}
                />
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
