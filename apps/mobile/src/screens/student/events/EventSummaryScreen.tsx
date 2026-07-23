import { useMemo, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useEventNotes, useEventUniversities, useMyUniversityInterests } from '@wrsi/api';
import { computeEventSummary } from '@wrsi/shared-utils';
import {
  Card,
  ClipboardIcon,
  FileTextIcon,
  ProgressBar,
  Screen,
  StarIcon,
  Text,
  UsersIcon,
  useTheme,
  type IconProps,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { useEventAgenda } from './useEventAgenda';

/**
 * "Resumen del evento" — the post-event recap.
 *
 * Every number is derived from what the student actually did: notes captured,
 * favorites ranked, and approved sessions. There is no attendance scanning, so
 * "meetings/workshops" counts approved sessions — the closest honest proxy for
 * attendance the data supports.
 */
export function EventSummaryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventSummary'>>().params;

  const universities = useEventUniversities(eventId);
  const notes = useEventNotes(eventId);
  const interests = useMyUniversityInterests();
  const { agenda, isLoading } = useEventAgenda(eventId);

  const summary = useMemo(() => {
    const eventIds = new Set((universities.data ?? []).map((u) => u.id));
    return computeEventSummary({
      universityCount: eventIds.size,
      notedUniversityIds: (notes.data ?? [])
        .filter((n) => (n.note ?? '').trim().length > 0 && n.university_id)
        .map((n) => n.university_id as string),
      // Scoped to this event's universities: a global favorite that wasn't here
      // is not part of what happened at this event.
      favoriteCount: (interests.data?.rows ?? []).filter(
        (r) => r.interest_level === 'favorite' && eventIds.has(r.university_id),
      ).length,
      agenda,
    });
  }, [universities.data, notes.data, interests.data, agenda]);

  if (isLoading || universities.isLoading) {
    return (
      <Screen testID="event-summary-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const tiles: { key: string; value: number; label: string; Icon: (p: IconProps) => ReactNode }[] =
    [
      {
        key: 'noted',
        value: summary.universitiesNoted,
        label: t('eventDetail.summary.universitiesNoted'),
        Icon: FileTextIcon,
      },
      {
        key: 'favorites',
        value: summary.favoriteCount,
        label: t('eventDetail.summary.favorites'),
        Icon: StarIcon,
      },
      {
        key: 'meetings',
        value: summary.meetingsAttended,
        label: t('eventDetail.summary.meetings'),
        Icon: UsersIcon,
      },
      {
        key: 'workshops',
        value: summary.workshopsAttended,
        label: t('eventDetail.summary.workshops'),
        Icon: ClipboardIcon,
      },
    ];

  return (
    <Screen scroll testID="event-summary-screen">
      <Text variant="muted">{t('eventDetail.summary.hint')}</Text>

      {/* 2×2 grid: these are short numeric stats with 1–3 word labels, which is
          the one shape DESIGN.md §1.4 explicitly allows two-across. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {tiles.map(({ key, value, label, Icon }) => (
          <Card
            key={key}
            testID={`event-summary-${key}`}
            style={{ flexBasis: '48%', flexGrow: 1, gap: theme.spacing.sm, padding: theme.spacing.md }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.color.brandSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} color={theme.color.brand} />
              </View>
              <Text variant="heading" style={{ fontSize: theme.fontSize.lg }}>
                {value}
              </Text>
            </View>
            <Text variant="label">{label}</Text>
          </Card>
        ))}
      </View>

      {summary.universityCount > 0 ? (
        <Card style={{ gap: theme.spacing.sm }}>
          <Text variant="muted">
            {t('eventDetail.summary.coverage', { percent: Math.round(summary.coverage * 100) })}
          </Text>
          <ProgressBar
            value={summary.coverage}
            color={theme.color.brand}
            trackColor={theme.color.brandSoft}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
