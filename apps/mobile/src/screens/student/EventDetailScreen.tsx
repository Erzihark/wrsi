import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  type EventNoteRow,
  useBookOneToOne,
  useCancelOneToOne,
  useEvent,
  useEventNotes,
  useEventUniversities,
  useEventWorkshops,
  useMyEventRegistrations,
  useMyStudentProfile,
  useMyWorkshopRegistrations,
  useOneToOnes,
  useSaveEventNote,
  useToggleEventRegistration,
  useToggleWorkshopRegistration,
} from '@wrsi/api';
import { formatGeography } from '@wrsi/shared-utils';
import { Button, Card, Chip, Input, Screen, Text, useTheme } from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../navigation/types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  return end && end !== start ? `${start} – ${end}` : start;
}

function NoteForm({
  studentId,
  eventId,
  universityId,
  universityName,
  existing,
}: {
  studentId: string;
  eventId: string;
  universityId: string;
  universityName: string;
  existing?: EventNoteRow;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const save = useSaveEventNote();
  const [note, setNote] = useState(existing?.note ?? '');
  const [ranking, setRanking] = useState<number | null>(existing?.ranking ?? null);

  return (
    <Card style={{ gap: theme.spacing.sm }}>
      <Text variant="label">{t('events.noteFor', { university: universityName })}</Text>
      <Input value={note} onChangeText={setNote} multiline placeholder={t('events.notes')} />
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip key={n} label={String(n)} selected={ranking === n} onPress={() => setRanking(n)} />
        ))}
      </View>
      <Button
        variant="secondary"
        title={t('events.saveNote')}
        loading={save.isPending}
        onPress={async () => {
          try {
            await save.mutateAsync({
              id: existing?.id,
              studentId,
              eventId,
              universityId,
              note,
              ranking,
            });
            Alert.alert(t('events.noteSaved'));
          } catch (e) {
            Alert.alert(t('common.error'), (e as Error).message);
          }
        }}
      />
    </Card>
  );
}

export function EventDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventDetail'>>().params;
  const spanish = i18n.language.startsWith('es');

  const event = useEvent(eventId);
  const profile = useMyStudentProfile();
  const universities = useEventUniversities(eventId);
  const workshops = useEventWorkshops(eventId);
  const oneToOnes = useOneToOnes(eventId);
  const eventRegistrations = useMyEventRegistrations();
  const workshopRegistrations = useMyWorkshopRegistrations(eventId);
  const notes = useEventNotes(eventId);

  const toggleEvent = useToggleEventRegistration();
  const toggleWorkshop = useToggleWorkshopRegistration();
  const bookSlot = useBookOneToOne();
  const cancelSlot = useCancelOneToOne();

  const studentId = profile.data?.id;
  const registered = eventRegistrations.data?.has(eventId) ?? false;

  if (!event.data) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const e = event.data;

  const meta = [formatDateRange(e.start_date, e.end_date), formatGeography(e.countries, e.states_provinces, spanish)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen scroll>
      <Text variant="heading">{e.title}</Text>
      {meta ? <Text variant="muted">{meta}</Text> : null}
      {e.description ? <Text style={{ marginTop: theme.spacing.sm }}>{e.description}</Text> : null}

      <Button
        variant={registered ? 'primary' : 'secondary'}
        title={registered ? t('events.registered') : t('events.register')}
        loading={toggleEvent.isPending}
        disabled={!studentId}
        onPress={() => {
          if (studentId) toggleEvent.mutate({ studentId, eventId, registered });
        }}
      />

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="label">{t('events.universities')}</Text>
        {universities.isLoading ? (
          <ActivityIndicator color={theme.color.primary} />
        ) : universities.data && universities.data.length > 0 ? (
          universities.data.map((u) => (
            <Card key={u.id}>
              <Text variant="title">{u.name}</Text>
            </Card>
          ))
        ) : (
          <Text variant="muted">{t('events.noUniversities')}</Text>
        )}
      </View>

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="label">{t('events.workshops')}</Text>
        {workshops.isLoading ? (
          <ActivityIndicator color={theme.color.primary} />
        ) : workshops.data && workshops.data.length > 0 ? (
          workshops.data.map((w) => {
            const isRegistered = workshopRegistrations.data?.has(w.id) ?? false;
            return (
              <Card key={w.id} style={{ gap: theme.spacing.xs }}>
                <Text variant="title">{w.title}</Text>
                <Text variant="muted">
                  {[w.universities?.name, `${formatTime(w.start_time)} – ${formatTime(w.end_time)}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Button
                  variant={isRegistered ? 'primary' : 'secondary'}
                  title={isRegistered ? t('events.registered') : t('events.register')}
                  disabled={!studentId}
                  onPress={async () => {
                    if (!studentId) return;
                    try {
                      await toggleWorkshop.mutateAsync({
                        studentId,
                        workshopId: w.id,
                        eventId,
                        registered: isRegistered,
                      });
                    } catch (err) {
                      Alert.alert(t('common.error'), (err as Error).message);
                    }
                  }}
                />
              </Card>
            );
          })
        ) : (
          <Text variant="muted">{t('events.noWorkshops')}</Text>
        )}
      </View>

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="label">{t('events.oneToOnes')}</Text>
        {oneToOnes.isLoading ? (
          <ActivityIndicator color={theme.color.primary} />
        ) : oneToOnes.data && oneToOnes.data.length > 0 ? (
          oneToOnes.data.map((slot) => {
            const mine = studentId != null && slot.student_id === studentId;
            const free = slot.student_id == null;
            return (
              <Card key={slot.id} style={{ gap: theme.spacing.xs }}>
                <Text variant="title">{slot.universities?.name ?? '—'}</Text>
                <Text variant="muted">{`${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`}</Text>
                <Button
                  variant={mine ? 'danger' : 'secondary'}
                  title={mine ? t('events.cancel') : free ? t('events.book') : t('events.full')}
                  disabled={!studentId || (!free && !mine)}
                  onPress={async () => {
                    if (!studentId) return;
                    try {
                      if (mine) {
                        await cancelSlot.mutateAsync({ id: slot.id, eventId });
                      } else {
                        await bookSlot.mutateAsync({ id: slot.id, studentId, eventId });
                      }
                    } catch (err) {
                      Alert.alert(t('common.error'), (err as Error).message);
                    }
                  }}
                />
              </Card>
            );
          })
        ) : (
          <Text variant="muted">{t('events.noOneToOnes')}</Text>
        )}
      </View>

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="label">{t('events.notes')}</Text>
        {!registered || !studentId ? (
          <Text variant="muted">{t('events.registerFirst')}</Text>
        ) : universities.data && universities.data.length > 0 ? (
          universities.data.map((u) => (
            <NoteForm
              key={u.id}
              studentId={studentId}
              eventId={eventId}
              universityId={u.id}
              universityName={u.name}
              existing={notes.data?.find((n) => n.university_id === u.id)}
            />
          ))
        ) : (
          <Text variant="muted">{t('events.noUniversities')}</Text>
        )}
      </View>
    </Screen>
  );
}
