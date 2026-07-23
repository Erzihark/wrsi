import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  useEvent,
  useEventNotes,
  useEventUniversities,
  useMyEventRegistrations,
  useMyStudentProfile,
  useMyUniversityInterests,
  useToggleEventRegistration,
} from '@wrsi/api';
import {
  computeEventPrep,
  eventPhase,
  FAVORITES_FOR_RANKING,
  formatDayMonthYear,
  formatTimestampRange,
  nextAgendaItem,
} from '@wrsi/shared-utils';
import {
  BellIcon,
  BookIcon,
  Button,
  CalendarIcon,
  Card,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  CompassIcon,
  FileTextIcon,
  FolderIcon,
  GraduationCapIcon,
  InfoIcon,
  MapPinIcon,
  ProgressRing,
  Screen,
  TargetIcon,
  Text,
  UsersIcon,
  useTheme,
  useToast,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EventHero, NavRow } from './components';
import { useEventAgenda } from './useEventAgenda';

type Nav = NativeStackNavigationProp<StudentEventsStackParamList, 'EventDetail'>;

/**
 * The event hub — the designer's three views of one event, selected by where
 * "today" falls relative to the event's dates:
 *
 * - **Antes** (`upcoming`): registration state + a readiness checklist, then the
 *   five preparation destinations.
 * - **Durante** (`live`): a "you're here" banner, the in-event destinations, and
 *   the next approved activity.
 * - **Después** (`past`): a thank-you banner and the review destinations.
 *
 * The phase decides *content*, not layout: all three are the same hero + status
 * card + list of full-width rows, which is what keeps this one screen rather
 * than three. See `eventPhase()` for the date rules.
 */
export function EventDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const nav = useNavigation<Nav>();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventDetail'>>().params;
  const spanish = i18n.language.startsWith('es');

  const event = useEvent(eventId);
  const profile = useMyStudentProfile();
  const universities = useEventUniversities(eventId);
  const registrations = useMyEventRegistrations();
  const interests = useMyUniversityInterests();
  const notes = useEventNotes(eventId);
  const { agenda, items } = useEventAgenda(eventId);
  const register = useToggleEventRegistration();

  const studentId = profile.data?.id;
  const registeredAt = registrations.data?.get(eventId) ?? null;
  const registered = registeredAt != null;
  const today = new Date().toISOString().slice(0, 10);

  // The checklist and the university filters only ever count universities that
  // are actually at *this* event — a student's global favorites may include
  // many that aren't attending.
  const eventUniversityIds = useMemo(
    () => new Set((universities.data ?? []).map((u) => u.id)),
    [universities.data],
  );
  const scopedInterests = useMemo(
    () => (interests.data?.rows ?? []).filter((r) => eventUniversityIds.has(r.university_id)),
    [interests.data, eventUniversityIds],
  );

  const prep = useMemo(
    () =>
      computeEventPrep({
        registered,
        interestedCount: scopedInterests.length,
        favoriteCount: scopedInterests.filter((r) => r.interest_level === 'favorite').length,
        meetingRequestCount: items.filter((i) => i.kind === 'meeting').length,
        workshopRequestCount: items.filter((i) => i.kind === 'workshop').length,
      }),
    [registered, scopedInterests, items],
  );

  if (!event.data) {
    return (
      <Screen testID="student-event-detail-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const e = event.data;
  const phase = eventPhase(e, today);
  const universityCount = universities.data?.length ?? 0;
  const next = nextAgendaItem(agenda);

  async function onRegister() {
    if (!studentId) return;
    try {
      await register.mutateAsync({ studentId, eventId, registered: false });
      toast.show({ type: 'success', message: t('eventDetail.status.registeredToast') });
    } catch (err) {
      toast.show({ type: 'error', message: (err as Error).message });
    }
  }

  const go = (screen: keyof StudentEventsStackParamList) =>
    nav.navigate(screen as 'EventUniversities', { eventId });

  return (
    // Not `<Screen scroll>`: an unregistered student gets a sticky "Registrarme"
    // bar, and `Screen scroll` *is* the ScrollView so it cannot host one
    // (DESIGN.md §1.1). Padding therefore moves onto the ScrollView.
    <Screen testID="student-event-detail-screen" style={{ padding: 0, gap: 0 }}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
        }}
      >
        <EventHero
          title={e.title}
          phase={phase}
          startDate={e.start_date}
          endDate={e.end_date}
          startTime={e.start_time}
          endTime={e.end_time}
          venue={e.location}
          country={e.countries}
          state={e.states_provinces}
          universityCount={universityCount}
          spanish={spanish}
        />

        <StatusCard
          phase={phase}
          registered={registered}
          registeredAt={registeredAt}
          spanish={spanish}
        />

        {/* The readiness ring is a pre-event device only: once the event has
            started, "get ready" is no longer actionable advice. */}
        {phase === 'upcoming' && registered ? <PrepCard prep={prep} /> : null}

        {phase === 'live' && next ? (
          <Card testID="event-next-activity" style={{ gap: theme.spacing.sm }}>
            <Text variant="label">{t('eventDetail.nextActivity.title')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.color.brandSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {next.kind === 'meeting' ? (
                  <UsersIcon size={22} color={theme.color.brand} />
                ) : (
                  <ClipboardIcon size={22} color={theme.color.brand} />
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="muted">
                  {t(next.kind === 'meeting' ? 'eventDetail.agenda.meeting' : 'eventDetail.agenda.workshop')}
                </Text>
                <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
                  {next.title}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  {formatTimestampRange(next.startTime, next.endTime) ? (
                    <MetaChip
                      icon={<ClockIcon size={14} color={theme.color.textMuted} />}
                      label={formatTimestampRange(next.startTime, next.endTime) as string}
                    />
                  ) : null}
                  {next.room ? (
                    <MetaChip
                      icon={<MapPinIcon size={14} color={theme.color.textMuted} />}
                      label={next.room}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Destinations. Which set appears is the whole point of the phase. */}
        {phase === 'upcoming' ? (
          <>
            <NavRow
              testID="event-nav-universities"
              icon={(c) => <GraduationCapIcon size={22} color={c} />}
              title={t('eventDetail.nav.universities')}
              body={t('eventDetail.nav.universitiesBody')}
              badge={universityCount > 0 ? String(universityCount) : undefined}
              onPress={() => go('EventUniversities')}
            />
            <NavRow
              testID="event-nav-meetings"
              icon={(c) => <UsersIcon size={22} color={c} />}
              title={t('eventDetail.nav.meetings')}
              body={t('eventDetail.nav.meetingsBody')}
              onPress={() => go('EventMeetings')}
            />
            <NavRow
              testID="event-nav-workshops"
              icon={(c) => <ClipboardIcon size={22} color={c} />}
              title={t('eventDetail.nav.workshops')}
              body={t('eventDetail.nav.workshopsBody')}
              onPress={() => go('EventWorkshops')}
            />
            <NavRow
              testID="event-nav-agenda"
              icon={(c) => <CalendarIcon size={22} color={c} />}
              title={t('eventDetail.nav.agenda')}
              body={t('eventDetail.nav.agendaBody')}
              onPress={() => go('EventAgenda')}
            />
            <NavRow
              testID="event-nav-info"
              icon={(c) => <InfoIcon size={22} color={c} />}
              title={t('eventDetail.nav.info')}
              body={t('eventDetail.nav.infoBody')}
              onPress={() => go('EventInfo')}
            />
          </>
        ) : phase === 'live' ? (
          <>
            <NavRow
              testID="event-nav-my-universities"
              icon={(c) => <GraduationCapIcon size={22} color={c} />}
              title={t('eventDetail.nav.myUniversities')}
              body={t('eventDetail.nav.myUniversitiesBodyLive')}
              onPress={() => go('EventMyUniversities')}
            />
            <NavRow
              testID="event-nav-agenda"
              icon={(c) => <CalendarIcon size={22} color={c} />}
              title={t('eventDetail.nav.agenda')}
              body={t('eventDetail.nav.agendaBodyLive')}
              onPress={() => go('EventAgenda')}
            />
            <NavRow
              testID="event-nav-notes"
              icon={(c) => <FileTextIcon size={22} color={c} />}
              title={t('eventDetail.nav.notes')}
              body={t('eventDetail.nav.notesBody')}
              badge={notes.data?.length ? String(notes.data.length) : undefined}
              onPress={() => go('EventNotes')}
            />
            <NavRow
              testID="event-nav-updates"
              icon={(c) => <BellIcon size={22} color={c} />}
              title={t('eventDetail.nav.updates')}
              body={t('eventDetail.nav.updatesBody')}
              onPress={() => nav.navigate('ComingSoon', { feature: 'eventUpdates' })}
            />
            <NavRow
              testID="event-nav-universities"
              icon={(c) => <BookIcon size={22} color={c} />}
              title={t('eventDetail.nav.universities')}
              body={t('eventDetail.nav.universitiesBody')}
              badge={universityCount > 0 ? String(universityCount) : undefined}
              onPress={() => go('EventUniversities')}
            />
          </>
        ) : (
          <>
            <NavRow
              testID="event-nav-my-universities"
              icon={(c) => <GraduationCapIcon size={22} color={c} />}
              title={t('eventDetail.nav.myUniversities')}
              body={t('eventDetail.nav.myUniversitiesBodyPast')}
              onPress={() => go('EventMyUniversities')}
            />
            <NavRow
              testID="event-nav-summary"
              icon={(c) => <TargetIcon size={22} color={c} />}
              title={t('eventDetail.nav.summary')}
              body={t('eventDetail.nav.summaryBody')}
              onPress={() => go('EventSummary')}
            />
            <NavRow
              testID="event-nav-next-steps"
              icon={(c) => <CompassIcon size={22} color={c} />}
              title={t('eventDetail.nav.nextSteps')}
              body={t('eventDetail.nav.nextStepsBody')}
              onPress={() => nav.navigate('ComingSoon', { feature: 'eventNextSteps' })}
            />
            <NavRow
              testID="event-nav-documents"
              icon={(c) => <FolderIcon size={22} color={c} />}
              title={t('eventDetail.nav.documents')}
              body={t('eventDetail.nav.documentsBody')}
              onPress={() => nav.navigate('ComingSoon', { feature: 'eventDocuments' })}
            />
          </>
        )}
      </ScrollView>

      {/* Registering is the one action this screen exists for while it's still
          open, so it's pinned rather than left at the end of the scroll. */}
      {!registered && phase !== 'past' ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.color.border,
            backgroundColor: theme.color.surface,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}
        >
          <Button
            testID="event-register"
            title={t('eventDetail.status.registerCta')}
            loading={register.isPending}
            disabled={!studentId}
            onPress={onRegister}
          />
        </View>
      ) : null}
    </Screen>
  );
}

/** The phase's headline card — the green/purple check block in the comp. */
function StatusCard({
  phase,
  registered,
  registeredAt,
  spanish,
}: {
  phase: 'upcoming' | 'live' | 'past';
  registered: boolean;
  registeredAt: string | null;
  spanish: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const { title, body, tint } = (() => {
    if (phase === 'past') {
      return {
        title: t('eventDetail.status.pastTitle'),
        body: t('eventDetail.status.pastBody'),
        tint: theme.color.brand,
      };
    }
    if (phase === 'live') {
      return {
        title: t('eventDetail.status.liveTitle'),
        body: t('eventDetail.status.liveBody'),
        tint: theme.color.success,
      };
    }
    if (registered) {
      const date = formatDayMonthYear(registeredAt, spanish ? 'es' : 'en');
      return {
        title: t('eventDetail.status.registeredTitle'),
        body: date ? t('eventDetail.status.registeredOn', { date }) : '',
        tint: theme.color.success,
      };
    }
    return {
      title: t('eventDetail.status.notRegisteredTitle'),
      body: t('eventDetail.status.notRegisteredBody'),
      tint: theme.color.accentDark,
    };
  })();

  return (
    <Card
      testID="event-status-card"
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.color.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckIcon size={18} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
          {title}
        </Text>
        {body ? <Text variant="muted">{body}</Text> : null}
      </View>
    </Card>
  );
}

/** "Preparando tu experiencia" — the 4/5 ring plus the checklist behind it. */
function PrepCard({ prep }: { prep: ReturnType<typeof computeEventPrep> }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card testID="event-prep-card" style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
            {t('eventDetail.prep.title')}
          </Text>
          <Text variant="muted">
            {prep.completed === prep.total ? t('eventDetail.prep.done') : t('eventDetail.prep.body')}
          </Text>
        </View>
        <ProgressRing value={prep.ratio} size={56} strokeWidth={5} color={theme.color.success}>
          <Text variant="label" style={{ fontSize: theme.fontSize.sm }}>
            {t('eventDetail.prep.progress', { done: prep.completed, total: prep.total })}
          </Text>
        </ProgressRing>
      </View>

      {/* The comp shows only the ring. Listing the steps is a deliberate
          addition: a bare "4/5" doesn't tell the student which action is
          missing, which is the whole point of the card. */}
      <View style={{ gap: theme.spacing.sm }}>
        {prep.steps.map((step) => (
          <View
            key={step.key}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: theme.radius.pill,
                marginTop: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: step.done ? theme.color.successSoft : theme.color.surfaceAlt,
              }}
            >
              {step.done ? <CheckIcon size={12} color={theme.color.success} /> : null}
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: theme.fontSize.sm,
                color: step.done ? theme.color.textMuted : theme.color.text,
              }}
            >
              {t(`eventDetail.prep.steps.${step.key}`, { count: FAVORITES_FOR_RANKING })}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

/** Small icon + label pair used in the "Próxima actividad" card. */
function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text variant="muted">{label}</Text>
    </View>
  );
}
