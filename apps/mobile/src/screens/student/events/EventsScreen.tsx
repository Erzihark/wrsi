import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useEvents, useMyEventRegistrations } from '@wrsi/api';
import { eventPhase, formatDayMonthYear, formatGeography } from '@wrsi/shared-utils';
import {
  Badge,
  Card,
  CalendarIcon,
  ChevronRightIcon,
  MapPinIcon,
  Screen,
  Text,
  useTheme,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EmptyState, EventPhaseBadge } from './components';

type Nav = NativeStackNavigationProp<StudentEventsStackParamList, 'EventsList'>;

/**
 * The events list. Each card is a doorway into the event hub, tagged with the
 * phase it's in so "Evento principal" / "En curso" / "Evento finalizado" reads
 * the same here as it does inside.
 *
 * Registration moved off this card: under the designed flow a student registers
 * from inside the event, after seeing who's attending, rather than from a list
 * row that shows them nothing.
 */
export function EventsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const events = useEvents();
  const registrations = useMyEventRegistrations();
  const spanish = i18n.language.startsWith('es');
  const locale = spanish ? 'es' : 'en';
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Screen testID="student-events-screen" style={{ padding: 0, gap: 0 }}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
        <Text variant="heading">{t('student.events')}</Text>
      </View>

      {events.isLoading ? (
        <ActivityIndicator color={theme.color.primary} style={{ marginTop: theme.spacing.lg }} />
      ) : (
        <FlatList
          data={events.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
            paddingBottom: theme.spacing.xxl,
          }}
          ListEmptyComponent={<EmptyState title={t('events.empty')} />}
          renderItem={({ item }) => {
            const from = formatDayMonthYear(item.start_date, locale);
            const to =
              item.end_date && item.end_date !== item.start_date
                ? formatDayMonthYear(item.end_date, locale)
                : null;
            const place = formatGeography(item.countries, item.states_provinces, spanish);
            return (
              <Pressable
                accessibilityRole="button"
                testID={`student-event-${item.id}`}
                onPress={() => nav.navigate('EventDetail', { eventId: item.id })}
              >
                {({ pressed }) => (
                  <Card style={{ gap: theme.spacing.sm, opacity: pressed ? 0.7 : 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        flexWrap: 'wrap',
                      }}
                    >
                      <EventPhaseBadge phase={eventPhase(item, today)} />
                      {registrations.data?.has(item.id) ? (
                        <Badge label={t('events.registered')} tone="success" />
                      ) : null}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Text variant="label" style={{ flex: 1, fontSize: theme.fontSize.md }}>
                        {item.title}
                      </Text>
                      <ChevronRightIcon size={20} color={theme.color.textMuted} />
                    </View>

                    {from ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CalendarIcon size={14} color={theme.color.textMuted} />
                        <Text variant="muted" style={{ flex: 1 }}>
                          {to ? `${from} – ${to}` : from}
                        </Text>
                      </View>
                    ) : null}
                    {place ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MapPinIcon size={14} color={theme.color.textMuted} />
                        <Text variant="muted" style={{ flex: 1 }}>
                          {place}
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
