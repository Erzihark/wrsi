import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  formatDayMonthYear,
  formatTimestampRange,
  groupAgendaByDay,
  type AgendaItem,
} from '@wrsi/shared-utils';
import {
  Card,
  ClipboardIcon,
  ClockIcon,
  MapPinIcon,
  Screen,
  Text,
  UsersIcon,
  useTheme,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EmptyState } from './components';
import { useEventAgenda } from './useEventAgenda';

/**
 * "Mi agenda" — the student's approved workshops and 1:1s, grouped by day.
 *
 * Only approved sessions appear (see `buildAgenda`): an agenda listing things
 * that might still be rejected would not be a schedule. Pending requests stay
 * on their own screens, where they can still be cancelled.
 */
export function EventAgendaScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventAgenda'>>().params;
  const { agenda, isLoading } = useEventAgenda(eventId);
  const locale = i18n.language.startsWith('es') ? 'es' : 'en';

  const groups = useMemo(() => groupAgendaByDay(agenda), [agenda]);

  if (isLoading) {
    return (
      <Screen testID="event-agenda-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll testID="event-agenda-screen">
      <Text variant="muted">{t('eventDetail.agenda.hint')}</Text>

      {groups.length === 0 ? (
        <EmptyState
          title={t('eventDetail.agenda.empty')}
          hint={t('eventDetail.agenda.emptyHint')}
        />
      ) : (
        groups.map((group) => (
          <View key={group.day ?? 'unscheduled'} style={{ gap: theme.spacing.sm }}>
            <Text variant="label">
              {group.day
                ? formatDayMonthYear(group.day, locale)
                : t('eventDetail.agenda.unscheduled')}
            </Text>
            {group.items.map((item) => (
              <AgendaCard key={item.id} item={item} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

function AgendaCard({ item }: { item: AgendaItem }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const when = formatTimestampRange(item.startTime, item.endTime);

  return (
    <Card
      testID={`event-agenda-item-${item.id}`}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.md,
          backgroundColor: theme.color.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.kind === 'meeting' ? (
          <UsersIcon size={20} color={theme.color.brand} />
        ) : (
          <ClipboardIcon size={20} color={theme.color.brand} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="muted">
          {t(item.kind === 'meeting' ? 'eventDetail.agenda.meeting' : 'eventDetail.agenda.workshop')}
        </Text>
        <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
          {item.title}
        </Text>
        {item.kind === 'workshop' && item.universityName ? (
          <Text variant="muted">{item.universityName}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ClockIcon size={14} color={theme.color.textMuted} />
            <Text variant="muted">{when ?? t('eventDetail.agenda.unscheduled')}</Text>
          </View>
          {item.room ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPinIcon size={14} color={theme.color.textMuted} />
              <Text variant="muted">{item.room}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
