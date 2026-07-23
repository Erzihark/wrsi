import { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useEventNotes, useEventUniversities } from '@wrsi/api';
import { Card, ChevronRightIcon, Screen, Text, useTheme } from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EmptyState } from './components';
import { UniversityLogo } from './EventUniversitiesScreen';

type Nav = NativeStackNavigationProp<StudentEventsStackParamList, 'EventNotes'>;

/**
 * "Notas del evento" — every note the student captured at this event, one per
 * university, each opening its university sheet to edit.
 *
 * Read-only here on purpose: the note is written where the context is (the
 * university's own screen), and duplicating an editor would give two places
 * that can disagree about unsaved text.
 */
export function EventNotesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventNotes'>>().params;

  const notes = useEventNotes(eventId);
  const universities = useEventUniversities(eventId);

  const rows = useMemo(() => {
    const byId = new Map((universities.data ?? []).map((u) => [u.id, u]));
    return (notes.data ?? [])
      .filter((n) => (n.note ?? '').trim().length > 0)
      .map((n) => ({
        id: n.id,
        universityId: n.university_id,
        name: (n.university_id && byId.get(n.university_id)?.name) || '—',
        logo: (n.university_id && byId.get(n.university_id)?.logo_url) || null,
        note: n.note as string,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [notes.data, universities.data]);

  if (notes.isLoading) {
    return (
      <Screen testID="event-notes-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll testID="event-notes-screen">
      <Text variant="muted">{t('eventDetail.notes.hint')}</Text>

      {rows.length === 0 ? (
        <EmptyState title={t('eventDetail.notes.empty')} hint={t('eventDetail.notes.emptyHint')} />
      ) : (
        rows.map((row) => (
          <Pressable
            key={row.id}
            accessibilityRole="button"
            testID={`event-note-${row.id}`}
            disabled={!row.universityId}
            onPress={() =>
              row.universityId &&
              nav.navigate('EventUniversityDetail', {
                eventId,
                universityId: row.universityId,
              })
            }
          >
            {({ pressed }) => (
              <Card style={{ gap: theme.spacing.sm, opacity: pressed ? 0.7 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                  <UniversityLogo url={row.logo} size={36} />
                  <Text variant="label" style={{ flex: 1, fontSize: theme.fontSize.md }}>
                    {row.name}
                  </Text>
                  <ChevronRightIcon size={20} color={theme.color.textMuted} />
                </View>
                <Text>{row.note}</Text>
              </Card>
            )}
          </Pressable>
        ))
      )}
    </Screen>
  );
}
