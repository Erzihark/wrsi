import type { ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useEvents, useMyEventRegistrations } from '@wrsi/api';
import {
  formatEventDateBadge,
  formatGeography,
  formatTimeRange,
  selectNextUpcomingEvent,
} from '@wrsi/shared-utils';
import {
  Badge,
  Card,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  SectionHeader,
  Text,
  useTheme,
} from '@wrsi/ui';
import type { StudentHomeStackParamList, StudentTabParamList } from '../../../navigation/types';

/**
 * "Tu próximo evento" — the soonest event that hasn't finished yet, which is by
 * product decision also the "Evento principal" (no featured flag).
 */
export function NextEventCard() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentHomeStackParamList>>();
  const events = useEvents();
  const registrations = useMyEventRegistrations();

  const spanish = i18n.language.startsWith('es');
  const today = new Date().toISOString().slice(0, 10);
  const event = selectNextUpcomingEvent(events.data, today);

  function goToEvents() {
    nav
      .getParent<BottomTabNavigationProp<StudentTabParamList>>()
      ?.navigate('Events', { screen: 'EventsList' });
  }

  function goToEvent(eventId: string) {
    nav
      .getParent<BottomTabNavigationProp<StudentTabParamList>>()
      ?.navigate('Events', { screen: 'EventDetail', params: { eventId } });
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <SectionHeader
        title={t('home.nextEvent.title')}
        actionLabel={t('home.seeAll')}
        actionTestID="student-events-see-all"
        onActionPress={goToEvents}
      />

      {!event ? (
        <Card testID="student-next-event-card">
          <Text variant="muted">{t('home.nextEvent.empty')}</Text>
        </Card>
      ) : (
        <Card testID="student-next-event-card" style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <EventImage imageUrl={event.image_url} dateISO={event.start_date} spanish={spanish} />

            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Badge label={t('home.nextEvent.principal')} />
              <Text variant="title">{event.title}</Text>

              {formatTimeRange(event.start_time, event.end_time) ? (
                <MetaRow icon={<ClockIcon size={14} color={theme.color.textMuted} />}>
                  {formatTimeRange(event.start_time, event.end_time)!}
                </MetaRow>
              ) : (
                <MetaRow icon={<CalendarIcon size={14} color={theme.color.textMuted} />}>
                  {event.start_date ?? ''}
                </MetaRow>
              )}

              {event.location || event.countries ? (
                <MetaRow icon={<MapPinIcon size={14} color={theme.color.textMuted} />}>
                  {[event.location, formatGeography(event.countries, event.states_provinces, spanish)]
                    .filter(Boolean)
                    .join(', ')}
                </MetaRow>
              ) : null}
            </View>
          </View>

          <RegistrationPill registered={registrations.data?.has(event.id) ?? false} />

          <Pressable
            testID="student-next-event-details"
            accessibilityRole="button"
            onPress={() => goToEvent(event.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: theme.color.primaryDark, fontWeight: theme.fontWeight.semibold }}>
              {t('home.nextEvent.details')}
            </Text>
            <ChevronRightIcon size={16} color={theme.color.primaryDark} />
          </Pressable>
        </Card>
      )}
    </View>
  );
}

/** Event banner with the date badge overlaid bottom-left; placeholder when no image. */
function EventImage({
  imageUrl,
  dateISO,
  spanish,
}: {
  imageUrl: string | null;
  dateISO: string | null;
  spanish: boolean;
}) {
  const theme = useTheme();
  const badge = formatEventDateBadge(dateISO, spanish ? 'es' : 'en');

  return (
    // overflow:hidden on the wrapper — Android won't clip a child Image to the
    // parent's borderRadius otherwise.
    <View
      style={{
        width: 108,
        height: 132,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        backgroundColor: theme.color.primarySoft,
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CalendarIcon size={28} color={theme.color.primary} />
        </View>
      )}

      {badge ? (
        <View
          style={{
            position: 'absolute',
            left: 6,
            bottom: 6,
            backgroundColor: theme.color.background,
            borderRadius: theme.radius.sm,
            paddingHorizontal: 8,
            paddingVertical: 4,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: theme.fontWeight.semibold, color: theme.color.textMuted }}>
            {badge.month}
          </Text>
          <Text style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, lineHeight: 22 }}>
            {badge.day}
          </Text>
          <Text style={{ fontSize: 8, color: theme.color.textMuted }}>{badge.weekday}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MetaRow({ icon, children }: { icon: ReactNode; children: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
      {icon}
      <Text variant="muted" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

function RegistrationPill({ registered }: { registered: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = registered ? theme.color.success : theme.color.warning;

  return (
    <View
      testID={registered ? 'student-event-registered' : 'student-event-not-registered'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        alignSelf: 'flex-start',
        backgroundColor: `${color}22`,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
      }}
    >
      {registered ? <CheckIcon size={14} color={color} /> : null}
      <Text style={{ color, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }}>
        {registered ? t('home.nextEvent.registered') : t('home.nextEvent.notRegistered')}
      </Text>
    </View>
  );
}
