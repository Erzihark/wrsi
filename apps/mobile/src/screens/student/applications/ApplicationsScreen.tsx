import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyApplications, useMyCounselor } from '@wrsi/api';
import {
  computeApplicationTimeline,
  computeOverallApplicationProgress,
  countApplications,
  matchesApplicationFilter,
  waChatUrl,
  type ApplicationFilter,
} from '@wrsi/shared-utils';
import {
  Button,
  Card,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  FolderIcon,
  GraduationCapIcon,
  ProgressBar,
  Screen,
  TargetIcon,
  Text,
  WhatsAppIcon,
  useTheme,
} from '@wrsi/ui';
import { useRefetchOnFocus } from '../../../lib/useRefetchOnFocus';
import { ApplicationCard } from './ApplicationCard';

/**
 * "Mis aplicaciones" — the student's applications with a per-card milestone
 * tracker, summary tiles, and overall progress.
 *
 * Read-only: applications are created and advanced by staff, so this screen
 * reports state rather than offering actions. The one action it does offer is
 * reaching a human — a single WhatsApp banner at the end of the list rather
 * than the per-card repeat in the desktop comp, which on a phone would put the
 * same button on screen four times over.
 *
 * Phone adaptation of a desktop comp: the four summary tiles become a 2×2 grid
 * that doubles as the list filter (tapping "En revisión" filters to it), which
 * is what the comp's "Ver detalles" links were reaching for, and saves a
 * separate filter sheet.
 */
export function ApplicationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const applications = useMyApplications();
  const counselor = useMyCounselor();
  // This tab hides its navigator header (the screen draws the designed heading
  // itself), so nothing upstream consumes the top inset — the list has to, or
  // the title renders under the status bar.
  const insets = useSafeAreaInsets();
  // Staff advance applications outside the app; a native-stack screen isn't
  // remounted on focus, so without this the list can sit stale after a change.
  useRefetchOnFocus(applications.refetch);

  const [filter, setFilter] = useState<ApplicationFilter>('all');
  const [newestFirst, setNewestFirst] = useState(true);

  const rows = useMemo(() => applications.data ?? [], [applications.data]);
  const counts = useMemo(() => countApplications(rows), [rows]);

  // Progress spans every application, not the filtered view — it answers "how
  // far along am I overall", which a filter shouldn't change.
  const progress = useMemo(
    () =>
      computeOverallApplicationProgress(
        rows.map((r) =>
          computeApplicationTimeline({
            createdAt: r.created_at,
            status: r.status,
            history: r.history,
          }),
        ),
      ),
    [rows],
  );

  const visible = useMemo(() => {
    // The query already returns newest-first; only the reverse needs work.
    const filtered = rows.filter((r) => matchesApplicationFilter(r.status?.name, filter));
    return newestFirst ? filtered : [...filtered].reverse();
  }, [rows, filter, newestFirst]);

  const chatUrl = waChatUrl(counselor.data?.phone);

  if (applications.isLoading) {
    return (
      <Screen testID="student-applications-screen" style={{ paddingTop: insets.top + theme.spacing.lg }}>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  return (
    <FlatList
      testID="student-applications-screen"
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingTop: insets.top + theme.spacing.lg,
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
      }}
      data={visible}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ApplicationCard application={item} />}
      ListHeaderComponent={
        <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.xs }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="heading">{t('applications.title')}</Text>
            <Text variant="muted">{t('applications.subtitle')}</Text>
          </View>

          {counts.all > 0 ? (
            <>
              <StatGrid counts={counts} filter={filter} onSelect={setFilter} />

              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  backgroundColor: theme.color.brandSoft,
                  borderColor: theme.color.brandSoft,
                }}
              >
                <TargetIcon size={28} color={theme.color.brand} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label">{t('applications.recommendation.title')}</Text>
                  <Text variant="muted">{t('applications.recommendation.body')}</Text>
                </View>
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
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="title" style={{ fontSize: theme.fontSize.md }}>
                      {t('applications.progress.title')}
                    </Text>
                    <Text variant="muted">{t('applications.progress.hint')}</Text>
                  </View>
                  <Text
                    style={{ color: theme.color.brand, fontWeight: theme.fontWeight.semibold }}
                  >
                    {t('applications.progress.completed', { percent: Math.round(progress * 100) })}
                  </Text>
                </View>
                <ProgressBar
                  value={progress}
                  color={theme.color.brand}
                  trackColor={theme.color.brandSoft}
                />
              </Card>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.spacing.sm,
                }}
              >
                <Text variant="title" style={{ flex: 1 }}>
                  {t('applications.listTitle')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  testID="student-applications-sort"
                  hitSlop={8}
                  onPress={() => setNewestFirst((v) => !v)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                    borderWidth: 1,
                    borderColor: theme.color.border,
                    backgroundColor: theme.color.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: theme.fontSize.sm, color: theme.color.textStrong }}>
                    {t(newestFirst ? 'applications.sort.newest' : 'applications.sort.oldest')}
                  </Text>
                  {/* ▾ is text-presentation only — no emoji variant to trip
                      Android's font fallback. */}
                  <Text style={{ fontSize: theme.fontSize.sm, color: theme.color.textMuted }}>▾</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <Card>
          <Text variant="muted">
            {counts.all === 0 ? t('applications.empty') : t('applications.emptyFiltered')}
          </Text>
          {counts.all === 0 ? <Text variant="muted">{t('applications.emptyHint')}</Text> : null}
        </Card>
      }
      ListFooterComponent={
        <Card
          testID="student-applications-help"
          style={{
            gap: theme.spacing.md,
            marginTop: theme.spacing.sm,
            backgroundColor: theme.color.brandSoft,
            borderColor: theme.color.brandSoft,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <GraduationCapIcon size={28} color={theme.color.brand} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="label">{t('applications.help.title')}</Text>
              <Text variant="muted">{t('applications.help.body')}</Text>
            </View>
          </View>
          {chatUrl ? (
            <Button
              testID="student-applications-whatsapp"
              title={t('applications.help.cta')}
              icon={(c) => <WhatsAppIcon size={16} color={c} />}
              onPress={() => void Linking.openURL(chatUrl)}
            />
          ) : null}
        </Card>
      }
    />
  );
}

/**
 * The 2×2 summary grid. Each tile is a filter toggle — tapping the active one
 * clears back to "all", so there's no separate reset control to find.
 */
function StatGrid({
  counts,
  filter,
  onSelect,
}: {
  counts: ReturnType<typeof countApplications>;
  filter: ApplicationFilter;
  onSelect: (next: ApplicationFilter) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Label/hint keys are spelled out rather than templated so the typed i18n
  // resources still catch a renamed key at compile time.
  const tiles = [
    {
      key: 'all' as const,
      count: counts.all,
      tint: theme.color.brand,
      Icon: FileTextIcon,
      label: 'applications.stats.total',
      hint: 'applications.stats.totalHint',
    },
    {
      key: 'review' as const,
      count: counts.review,
      tint: theme.color.accentDark,
      Icon: ClockIcon,
      label: 'applications.stats.review',
      hint: 'applications.stats.reviewHint',
    },
    {
      key: 'accepted' as const,
      count: counts.accepted,
      tint: theme.color.success,
      Icon: CheckIcon,
      label: 'applications.stats.accepted',
      hint: 'applications.stats.acceptedHint',
    },
    {
      key: 'draft' as const,
      count: counts.draft,
      tint: theme.color.textMuted,
      Icon: FolderIcon,
      label: 'applications.stats.draft',
      hint: 'applications.stats.draftHint',
    },
  ] as const;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {tiles.map(({ key, count, tint, Icon, label, hint }) => {
        const active = filter === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            testID={`student-applications-stat-${key}`}
            onPress={() => onSelect(active ? 'all' : key)}
            style={({ pressed }) => ({
              // Two per row. A flat 50% would overflow once the row gap is
              // added and drop to one tile per row, so the basis leaves room
              // for the gap and flexGrow takes the slack back.
              flexBasis: '48%',
              flexGrow: 1,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Card
              style={{
                gap: theme.spacing.sm,
                padding: theme.spacing.md,
                borderColor: active ? theme.color.brand : theme.color.border,
                borderWidth: active ? 2 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.color.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={tint} />
                </View>
                <Text variant="heading" style={{ fontSize: theme.fontSize.lg }}>
                  {count}
                </Text>
              </View>
              <View style={{ gap: 1 }}>
                <Text variant="label" numberOfLines={1}>
                  {t(label)}
                </Text>
                <Text variant="muted" numberOfLines={1} style={{ fontSize: theme.fontSize.xs }}>
                  {t(hint)}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
