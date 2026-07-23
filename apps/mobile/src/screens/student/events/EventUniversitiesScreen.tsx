import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useEventUniversities, type EventUniversity } from '@wrsi/api';
import {
  formatGeography,
  matchesUniversityFilter,
  sanitizeSearchTerm,
  type UniversityFilter,
} from '@wrsi/shared-utils';
import {
  Card,
  GraduationCapIcon,
  Input,
  Screen,
  SegmentedTabs,
  StarIcon,
  Text,
  useTheme,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EmptyState, InterestStar } from './components';
import { useInterestCycle } from './useInterestCycle';

type Nav = NativeStackNavigationProp<StudentEventsStackParamList, 'EventUniversities'>;

/**
 * "Universidades participantes" — search, the Todas / Favoritas / Interesadas
 * filter, and a ☆/★ toggle per row.
 *
 * Search is client-side: the list is one event's universities (tens, not
 * thousands) and they are already in the cache, so filtering locally keeps
 * typing instant and avoids a request per keystroke.
 */
export function EventUniversitiesScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventUniversities'>>().params;
  const spanish = i18n.language.startsWith('es');

  const universities = useEventUniversities(eventId);
  const { levelFor, cycle } = useInterestCycle();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UniversityFilter>('all');

  const rows = useMemo(() => universities.data ?? [], [universities.data]);

  const counts = useMemo(() => {
    let favorite = 0;
    let interested = 0;
    for (const u of rows) {
      const level = levelFor(u.id);
      if (level === 'favorite') favorite += 1;
      else if (level === 'interested') interested += 1;
    }
    return { all: rows.length, favorite, interested };
  }, [rows, levelFor]);

  const visible = useMemo(() => {
    const term = sanitizeSearchTerm(search).toLowerCase();
    return rows.filter(
      (u) =>
        matchesUniversityFilter(levelFor(u.id), filter) &&
        (term === '' || u.name.toLowerCase().includes(term)),
    );
  }, [rows, search, filter, levelFor]);

  if (universities.isLoading) {
    return (
      <Screen testID="event-universities-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  return (
    <Screen testID="event-universities-screen" style={{ padding: 0, gap: 0 }}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Input
          testID="event-universities-search"
          placeholder={t('eventDetail.universities.search')}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <SegmentedTabs
          testID="event-universities-filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('eventDetail.universities.all'), count: counts.all },
            {
              value: 'favorite',
              label: t('eventDetail.universities.favorites'),
              count: counts.favorite,
            },
            {
              value: 'interested',
              label: t('eventDetail.universities.interested'),
              count: counts.interested,
            },
          ]}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.sm,
        }}
        ListEmptyComponent={
          <EmptyState
            title={
              rows.length === 0
                ? t('eventDetail.universities.emptyEvent')
                : t('eventDetail.universities.empty')
            }
          />
        }
        ListFooterComponent={visible.length > 0 ? <InterestLegend /> : null}
        renderItem={({ item }) => (
          <UniversityRow
            university={item}
            level={levelFor(item.id)}
            spanish={spanish}
            onToggle={() => void cycle(item.id)}
            onPress={() =>
              nav.navigate('EventUniversityDetail', { eventId, universityId: item.id })
            }
          />
        )}
      />
    </Screen>
  );
}

function UniversityRow({
  university,
  level,
  spanish,
  onToggle,
  onPress,
}: {
  university: EventUniversity;
  level: ReturnType<ReturnType<typeof useInterestCycle>['levelFor']>;
  spanish: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const theme = useTheme();
  const place = formatGeography(
    university.states_provinces?.countries ?? null,
    university.states_provinces ?? null,
    spanish,
  );

  return (
    <Pressable accessibilityRole="button" testID={`event-university-${university.id}`} onPress={onPress}>
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
          <UniversityLogo url={university.logo_url} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
              {university.name}
            </Text>
            {place ? <Text variant="muted">{place}</Text> : null}
          </View>
          <InterestStar
            level={level}
            onPress={onToggle}
            testID={`event-university-star-${university.id}`}
          />
        </Card>
      )}
    </Pressable>
  );
}

/** Square logo with a graduation-cap fallback when a university has no image. */
export function UniversityLogo({ url, size = 44 }: { url: string | null; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.md,
        backgroundColor: theme.color.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <GraduationCapIcon size={size / 2} color={theme.color.brand} />
      )}
    </View>
  );
}

/**
 * The comp's footnote explaining the two star states. Rendered with the real
 * `StarIcon` rather than the comp's ⭐/☆ glyphs — ⭐ (U+2B50) has an emoji
 * presentation that Android's font fallback colors in, ignoring `color`.
 */
function InterestLegend() {
  const { t } = useTranslation();
  const theme = useTheme();
  const rows = [
    { filled: true, text: t('eventDetail.universities.legendFavorite') },
    { filled: false, text: t('eventDetail.universities.legendInterested') },
  ];

  return (
    <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
      {rows.map((row) => (
        <View
          key={row.text}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}
        >
          <View style={{ paddingTop: 2 }}>
            <StarIcon size={16} filled={row.filled} color={theme.color.accentDark} />
          </View>
          <Text variant="muted" style={{ flex: 1 }}>
            {row.text}
          </Text>
        </View>
      ))}
    </View>
  );
}
