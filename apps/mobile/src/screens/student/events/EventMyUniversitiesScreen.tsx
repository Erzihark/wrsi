import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list';
import { useTranslation } from 'react-i18next';
import {
  useEventUniversities,
  useMyStudentProfile,
  useMyUniversityInterests,
  useReorderFavoriteUniversities,
  useUniversities,
} from '@wrsi/api';
import {
  eventPhase,
  formatGeography,
  renumberRanks,
  sortByRank,
} from '@wrsi/shared-utils';
import { useEvent } from '@wrsi/api';
import {
  Card,
  GripIcon,
  Screen,
  SegmentedTabs,
  Text,
  useTheme,
  useToast,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EmptyState, InterestStar } from './components';
import { UniversityLogo } from './EventUniversitiesScreen';
import { useInterestCycle } from './useInterestCycle';

type Nav = NativeStackNavigationProp<StudentEventsStackParamList, 'EventMyUniversities'>;
type Tab = 'ranking' | 'all';

interface RankedUniversity {
  id: string;
  name: string;
  logo_url: string | null;
  place: string;
}

/**
 * "Mis universidades" — the drag-ordered personal top, plus the event's full
 * list for adding to it.
 *
 * The ranking shown is the student's **whole** favorites list, not just the
 * universities attending this event: `rank` is global (see migration
 * 20260723000001), so renumbering a filtered subset would silently rewrite the
 * positions of favorites that happen not to be here. The "Todas" tab is what's
 * scoped to the event.
 */
export function EventMyUniversitiesScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const nav = useNavigation<Nav>();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventMyUniversities'>>().params;
  const spanish = i18n.language.startsWith('es');

  const event = useEvent(eventId);
  const eventUniversities = useEventUniversities(eventId);
  const allUniversities = useUniversities();
  const interests = useMyUniversityInterests();
  const profile = useMyStudentProfile();
  const reorder = useReorderFavoriteUniversities();
  const { levelFor, cycle } = useInterestCycle();

  const [tab, setTab] = useState<Tab>('ranking');

  const today = new Date().toISOString().slice(0, 10);
  const phase = event.data ? eventPhase(event.data, today) : 'upcoming';
  const studentId = profile.data?.id;

  // Names/logos for favorites come from the global directory, since a favorite
  // may not be attending this event.
  const directory = useMemo(() => {
    const map = new Map<string, { name: string; logo_url: string | null; place: string }>();
    for (const u of allUniversities.data ?? []) {
      map.set(u.id, { name: u.name, logo_url: u.logo_url, place: '' });
    }
    for (const u of eventUniversities.data ?? []) {
      map.set(u.id, {
        name: u.name,
        logo_url: u.logo_url,
        place: formatGeography(
          u.states_provinces?.countries ?? null,
          u.states_provinces ?? null,
          spanish,
        ),
      });
    }
    return map;
  }, [allUniversities.data, eventUniversities.data, spanish]);

  const favorites = useMemo<RankedUniversity[]>(() => {
    const rows = (interests.data?.rows ?? []).filter((r) => r.interest_level === 'favorite');
    return sortByRank(rows).map((row) => {
      const info = directory.get(row.university_id);
      return {
        id: row.university_id,
        name: info?.name ?? '—',
        logo_url: info?.logo_url ?? null,
        place: info?.place ?? '',
      };
    });
  }, [interests.data, directory]);

  // Local copy so the drag animates against optimistic order while the write
  // is in flight; re-synced whenever the server list changes.
  const [order, setOrder] = useState<RankedUniversity[]>(favorites);
  useEffect(() => setOrder(favorites), [favorites]);

  // What the server currently believes each favorite's position is. Passing
  // this (rather than the old array index) is what lets `renumberRanks` write
  // only the rows that actually moved.
  const storedRanks = useMemo(
    () => new Map((interests.data?.rows ?? []).map((r) => [r.university_id, r.rank])),
    [interests.data],
  );

  async function onReorder(from: number, to: number) {
    const next = reorderItems(order, from, to);
    setOrder(next);
    if (!studentId) return;
    const ranks = renumberRanks(
      next.map((u) => ({ university_id: u.id, rank: storedRanks.get(u.id) ?? null })),
    );
    try {
      await reorder.mutateAsync({ studentId, ranks });
    } catch (err) {
      setOrder(favorites); // roll back to the server's truth
      toast.show({ type: 'error', message: (err as Error).message });
    }
  }

  const loading = interests.isLoading || eventUniversities.isLoading;
  const eventRows = eventUniversities.data ?? [];

  return (
    <Screen testID="event-my-universities-screen" style={{ padding: 0, gap: 0 }}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
        <SegmentedTabs
          testID="event-my-universities-tabs"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'ranking', label: t('eventDetail.myUniversities.ranking'), count: order.length },
            { value: 'all', label: t('eventDetail.myUniversities.all'), count: eventRows.length },
          ]}
        />
        <Text variant="muted">
          {tab === 'ranking'
            ? phase === 'past'
              ? t('eventDetail.myUniversities.hintPast')
              : t('eventDetail.myUniversities.hint')
            : t('eventDetail.universities.legendFavorite')}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : tab === 'ranking' ? (
        order.length === 0 ? (
          <View style={{ paddingHorizontal: theme.spacing.lg }}>
            <EmptyState
              title={t('eventDetail.myUniversities.empty')}
              hint={t('eventDetail.myUniversities.emptyHint')}
            />
          </View>
        ) : (
          <ReorderableList
            data={order}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.xxl,
              gap: theme.spacing.sm,
            }}
            onReorder={({ from, to }) => void onReorder(from, to)}
            renderItem={({ item, index }) => (
              <RankedRow
                university={item}
                position={index + 1}
                onPress={() =>
                  nav.navigate('EventUniversityDetail', { eventId, universityId: item.id })
                }
                onToggleStar={() => void cycle(item.id)}
              />
            )}
          />
        )
      ) : (
        <FlatList
          data={eventRows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
            gap: theme.spacing.sm,
          }}
          ListEmptyComponent={<EmptyState title={t('eventDetail.universities.emptyEvent')} />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`event-my-university-${item.id}`}
              onPress={() => nav.navigate('EventUniversityDetail', { eventId, universityId: item.id })}
            >
              {({ pressed }) => (
                <Card
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    padding: theme.spacing.md,
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <UniversityLogo url={item.logo_url} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
                      {item.name}
                    </Text>
                    <Text variant="muted">
                      {formatGeography(
                        item.states_provinces?.countries ?? null,
                        item.states_provinces ?? null,
                        spanish,
                      )}
                    </Text>
                  </View>
                  <InterestStar level={levelFor(item.id)} onPress={() => void cycle(item.id)} />
                </Card>
              )}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

/**
 * One row of the ranking: position, logo, name, star, and the drag handle.
 *
 * `useReorderableDrag` must be called from inside `renderItem`'s subtree — it
 * reads the item's index from the list's own context, which is why this is a
 * component rather than an inline render.
 */
function RankedRow({
  university,
  position,
  onPress,
  onToggleStar,
}: {
  university: RankedUniversity;
  position: number;
  onPress: () => void;
  onToggleStar: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const drag = useReorderableDrag();

  return (
    <Card
      testID={`event-ranking-${university.id}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
      }}
    >
      {/* Long-press anywhere on the handle starts the drag. It is a 44px target
          — the platform minimum — rather than the comp's thin grip glyph. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('eventDetail.myUniversities.dragHandle')}
        testID={`event-ranking-handle-${university.id}`}
        onLongPress={drag}
        delayLongPress={200}
        hitSlop={8}
        style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <GripIcon size={20} color={theme.color.textMuted} />
      </Pressable>

      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.color.brand,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: theme.color.textOnDark,
            fontSize: theme.fontSize.xs,
            fontWeight: theme.fontWeight.bold,
          }}
        >
          {position}
        </Text>
      </View>

      <UniversityLogo url={university.logo_url} size={32} />

      <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1 }}>
        <Text variant="label">{university.name}</Text>
        {university.place ? <Text variant="muted">{university.place}</Text> : null}
      </Pressable>

      <InterestStar level="favorite" onPress={onToggleStar} size={20} />
    </Card>
  );
}
