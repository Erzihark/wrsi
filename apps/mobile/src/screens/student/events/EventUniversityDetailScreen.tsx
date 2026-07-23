import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useEventNotes,
  useEventUniversities,
  useMyMeetingRequests,
  useMyStudentProfile,
  useRequestMeeting,
  useSaveEventNote,
  useUniversityPrograms,
} from '@wrsi/api';
import { formatGeography } from '@wrsi/shared-utils';
import {
  Badge,
  Button,
  Card,
  Chip,
  GlobeIcon,
  Input,
  Screen,
  Text,
  UsersIcon,
  useTheme,
  useToast,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { InterestStar, RequestStatusBadge } from './components';
import { UniversityLogo } from './EventUniversitiesScreen';
import { useInterestCycle } from './useInterestCycle';

const DESCRIPTION_PREVIEW_LINES = 4;

/**
 * One university, seen from inside an event: identity, description, featured
 * programs, the student's private note, and the 1:1 request CTA.
 *
 * Two deliberate omissions from the comp:
 *
 * - **"Representante en el evento"** (the named contact with mail/chat buttons)
 *   is removed at the client's request.
 * - **The "Universidad · Pública · Inglés" chip row** has no data behind it —
 *   `universities` has no institution-type, funding or language-of-instruction
 *   column. Inventing values would be worse than omitting the row; it can come
 *   back once those fields exist. Recorded in PROGRESS.md.
 */
export function EventUniversityDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const { eventId, universityId } =
    useRoute<RouteProp<StudentEventsStackParamList, 'EventUniversityDetail'>>().params;
  const spanish = i18n.language.startsWith('es');

  const universities = useEventUniversities(eventId);
  const programs = useUniversityPrograms(universityId);
  const profile = useMyStudentProfile();
  const notes = useEventNotes(eventId);
  const meetings = useMyMeetingRequests(eventId);
  const saveNote = useSaveEventNote();
  const requestMeeting = useRequestMeeting();
  const { levelFor, cycle } = useInterestCycle();

  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState('');

  const university = universities.data?.find((u) => u.id === universityId);
  const existingNote = notes.data?.find((n) => n.university_id === universityId);
  const meeting = meetings.data?.find((m) => m.university_id === universityId);
  const studentId = profile.data?.id;

  // Seed the editor from the saved note whenever it changes underneath us, but
  // never while the student is mid-edit — that would wipe what they're typing.
  useEffect(() => {
    if (!editingNote) setDraft(existingNote?.note ?? '');
  }, [existingNote?.note, editingNote]);

  if (!university) {
    return (
      <Screen testID="event-university-detail-screen">
        {universities.isLoading ? (
          <ActivityIndicator color={theme.color.primary} />
        ) : (
          <Text variant="muted">{t('eventDetail.universities.emptyEvent')}</Text>
        )}
      </Screen>
    );
  }

  const place = formatGeography(
    university.states_provinces?.countries ?? null,
    university.states_provinces ?? null,
    spanish,
  );

  async function onSaveNote() {
    if (!studentId) return;
    try {
      await saveNote.mutateAsync({
        id: existingNote?.id,
        studentId,
        eventId,
        universityId,
        note: draft,
        // The 1-5 star rating is legacy; the personal ranking now lives in the
        // drag-ordered favorites. Pass it through so editing a note can't wipe
        // a value captured before this change.
        ranking: existingNote?.ranking ?? null,
      });
      setEditingNote(false);
      toast.show({ type: 'success', message: t('eventDetail.university.notesSaved') });
    } catch (err) {
      toast.show({ type: 'error', message: (err as Error).message });
    }
  }

  async function onRequestMeeting() {
    if (!studentId) return;
    try {
      await requestMeeting.mutateAsync({ studentId, eventId, universityId });
      toast.show({ type: 'success', message: t('eventDetail.meetings.requestedToast') });
    } catch (err) {
      const message = (err as { code?: string; message: string });
      toast.show({
        type: 'error',
        // 23505 = the partial unique index that allows only one live request
        // per university; say what that means rather than leaking the SQL.
        message: message.code === '23505' ? t('eventDetail.meetings.duplicate') : message.message,
      });
    }
  }

  return (
    <Screen testID="event-university-detail-screen" style={{ padding: 0, gap: 0 }}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
        }}
      >
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <UniversityLogo url={university.logo_url} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
              {university.name}
            </Text>
            {place ? <Text variant="muted">{place}</Text> : null}
          </View>
          <InterestStar
            level={levelFor(universityId)}
            onPress={() => void cycle(universityId)}
            testID="event-university-detail-star"
            size={26}
          />
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t('eventDetail.university.about')}</Text>
          {university.description ? (
            <>
              <Text numberOfLines={expanded ? undefined : DESCRIPTION_PREVIEW_LINES}>
                {university.description}
              </Text>
              {/* The only place a clamp is acceptable per DESIGN.md §1.3: the
                  full text is one tap away and the control says so. */}
              <Text
                accessibilityRole="button"
                testID="event-university-see-more"
                onPress={() => setExpanded((v) => !v)}
                style={{
                  color: theme.color.primaryDark,
                  fontWeight: theme.fontWeight.semibold,
                  fontSize: theme.fontSize.sm,
                }}
              >
                {expanded ? t('eventDetail.university.seeLess') : t('eventDetail.university.seeMore')}
              </Text>
            </>
          ) : (
            <Text variant="muted">{t('eventDetail.university.noDescription')}</Text>
          )}
          {university.website ? (
            <Button
              variant="ghost"
              title={t('eventDetail.university.website')}
              icon={(c) => <GlobeIcon size={16} color={c} />}
              onPress={() => void Linking.openURL(university.website as string)}
            />
          ) : null}
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text variant="label">{t('eventDetail.university.programs')}</Text>
          {programs.isLoading ? (
            <ActivityIndicator color={theme.color.primary} />
          ) : programs.data && programs.data.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {programs.data.map((p) => (
                <Badge key={p.id} label={p.name} tone="brand" />
              ))}
            </View>
          ) : (
            <Text variant="muted">{t('eventDetail.university.noPrograms')}</Text>
          )}
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: theme.spacing.sm,
            }}
          >
            <Text variant="label" style={{ flex: 1 }}>
              {t('eventDetail.university.myNotes')}
            </Text>
            {!editingNote ? (
              <Text
                accessibilityRole="button"
                testID="event-university-edit-note"
                onPress={() => setEditingNote(true)}
                style={{
                  color: theme.color.primaryDark,
                  fontWeight: theme.fontWeight.semibold,
                  fontSize: theme.fontSize.sm,
                }}
              >
                {t('eventDetail.university.edit')}
              </Text>
            ) : null}
          </View>

          {editingNote ? (
            <>
              <Input
                testID="event-university-note-input"
                value={draft}
                onChangeText={setDraft}
                multiline
                placeholder={t('eventDetail.university.notesPlaceholder')}
              />
              <Button
                testID="event-university-save-note"
                variant="brand"
                title={t('eventDetail.university.saveNotes')}
                loading={saveNote.isPending}
                disabled={!studentId}
                onPress={onSaveNote}
              />
            </>
          ) : existingNote?.note ? (
            <Text>{existingNote.note}</Text>
          ) : (
            <Text variant="muted">{t('eventDetail.university.notesEmpty')}</Text>
          )}
        </Card>

        {meeting ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <UsersIcon size={20} color={theme.color.brand} />
              <Text variant="label" style={{ flex: 1 }}>
                {t('eventDetail.nav.meetings')}
              </Text>
              <RequestStatusBadge status={meeting.status as 'pending' | 'approved' | 'rejected'} />
            </View>
            <Text variant="muted">
              {meeting.status === 'approved' && meeting.room
                ? meeting.room
                : t('eventDetail.meetings.pendingSchedule')}
            </Text>
          </Card>
        ) : null}
      </ScrollView>

      {/* The comp's primary action for this screen. Pinned so it stays reachable
          under a long description + program list (DESIGN.md §1.1). */}
      {!meeting ? (
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
            testID="event-university-request-meeting"
            title={t('eventDetail.university.requestMeeting')}
            icon={(c) => <UsersIcon size={16} color={c} />}
            loading={requestMeeting.isPending}
            disabled={!studentId}
            onPress={onRequestMeeting}
          />
        </View>
      ) : null}
    </Screen>
  );
}
