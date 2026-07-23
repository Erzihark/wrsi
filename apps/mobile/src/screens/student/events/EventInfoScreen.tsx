import { ActivityIndicator, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useEvent, useEventUniversities } from '@wrsi/api';
import { formatDayMonthYear, formatGeography, formatTimeRange } from '@wrsi/shared-utils';
import { Card, Screen, Text, useTheme } from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';

/**
 * "Información del evento" — the practical detail: dates, schedule, venue,
 * location, deadline, and how many universities are attending.
 *
 * The comp promises "Fechas, sedes, transporte y más". Transport has no field
 * in `events` (there is one free-text `location`, formalized as the venue
 * name), so this renders what exists and marks the rest "Por confirmar" rather
 * than showing an empty row. Noted in PROGRESS.md.
 */
export function EventInfoScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventInfo'>>().params;
  const spanish = i18n.language.startsWith('es');
  const locale = spanish ? 'es' : 'en';

  const event = useEvent(eventId);
  const universities = useEventUniversities(eventId);

  if (!event.data) {
    return (
      <Screen testID="event-info-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const e = event.data;
  const from = formatDayMonthYear(e.start_date, locale);
  const to = e.end_date && e.end_date !== e.start_date ? formatDayMonthYear(e.end_date, locale) : null;

  const rows: { label: string; value: string | null }[] = [
    { label: t('eventDetail.info.dates'), value: from ? (to ? `${from} – ${to}` : from) : null },
    { label: t('eventDetail.info.schedule'), value: formatTimeRange(e.start_time, e.end_time) },
    { label: t('eventDetail.info.venue'), value: e.location },
    {
      label: t('eventDetail.info.location'),
      value: formatGeography(e.countries, e.states_provinces, spanish) || null,
    },
    { label: t('eventDetail.info.type'), value: e.event_type },
    {
      label: t('eventDetail.info.registrationDeadline'),
      value: formatDayMonthYear(e.registration_deadline, locale),
    },
    {
      label: t('eventDetail.info.universities'),
      value: universities.data
        ? t('eventDetail.universitiesCount', { count: universities.data.length })
        : null,
    },
  ];

  return (
    <Screen scroll testID="event-info-screen">
      <Card style={{ gap: 0, paddingVertical: theme.spacing.sm }}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.color.border,
            }}
          >
            <Text variant="label" style={{ flex: 1 }}>
              {row.label}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: 'right',
                color: row.value ? theme.color.text : theme.color.textMuted,
              }}
            >
              {row.value ?? t('eventDetail.info.missing')}
            </Text>
          </View>
        ))}
      </Card>

      {e.description ? (
        <Card style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t('eventDetail.info.about')}</Text>
          <Text>{e.description}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
