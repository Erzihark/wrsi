import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { useMyApplications } from '@wrsi/api';
import {
  computeApplicationTimeline,
  formatDayMonthYear,
  formatGeography,
  intakeTermLabel,
  type DateWordsLocale,
} from '@wrsi/shared-utils';
import { Avatar, Badge, Card, ChevronRightIcon, Text, useTheme, type BadgeTone } from '@wrsi/ui';
import type { StudentTabParamList } from '../../../navigation/types';
import { ApplicationTimeline } from './ApplicationTimeline';

export type ApplicationRow = NonNullable<ReturnType<typeof useMyApplications>['data']>[number];

/**
 * Badge treatment per catalog status. The `statuses.color` column is ignored
 * here on purpose: those hexes predate the brand palette (indigo/slate), and
 * the designer's cards are meant to read in the app's own colors. Unknown
 * statuses — the catalog is admin-editable — fall back to neutral.
 */
const STATUS_TONE: Record<string, BadgeTone> = {
  Draft: 'neutral',
  Submitted: 'brand',
  'Under Review': 'accent',
  Accepted: 'success',
  Rejected: 'danger',
  Enrolled: 'success',
};

/** Which dated line sits under the badge ("Decisión: …", "Enviado el …", …). */
const META_KEY = {
  Draft: 'applications.meta.draft',
  Submitted: 'applications.meta.submitted',
  'Under Review': 'applications.meta.review',
  Accepted: 'applications.meta.decision',
  Rejected: 'applications.meta.decision',
  Enrolled: 'applications.meta.decision',
} as const satisfies Record<string, string>;

export function ApplicationCard({ application }: { application: ApplicationRow }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const spanish = i18n.language.startsWith('es');
  const locale: DateWordsLocale = spanish ? 'es' : 'en';
  // Applications is its own tab (no stack), and the detail screen it links to
  // lives in the Universities tab's stack — so this jumps tabs rather than
  // pushing, the same pattern the dashboard's counselor card uses to reach the
  // (now tab-less) Consejero screen.
  const nav = useNavigation<BottomTabNavigationProp<StudentTabParamList>>();
  const universityId = application.university?.id;

  const statusName = application.status?.name;
  const timeline = computeApplicationTimeline({
    createdAt: application.created_at,
    status: application.status,
    history: application.history,
  });

  const location = formatGeography(
    application.university?.state_province?.country,
    application.university?.state_province,
    spanish,
  );

  // The chip names the degree applied to; before staff pick a program it falls
  // back to the intake the student is aiming for, so the row is never empty.
  const intake = [
    application.intake_term ? intakeTermLabel(application.intake_term) : null,
    application.intake_year,
  ]
    .filter(Boolean)
    .join(' ');
  const chipLabel = application.program?.name ?? intake;

  // Dated from the milestone the status corresponds to, so "Decisión: …" shows
  // the decision date rather than whenever the row was last touched. A draft has
  // reached no milestone, and its line reads "Última edición" — that one really
  // is `updated_at`.
  const metaStep = timeline.steps[timeline.currentIndex];
  const metaDate = formatDayMonthYear(
    metaStep?.at ?? (timeline.currentIndex < 0 ? application.updated_at : application.created_at),
    locale,
  );
  const metaKey =
    statusName && statusName in META_KEY
      ? META_KEY[statusName as keyof typeof META_KEY]
      : undefined;

  return (
    <Card testID={`student-application-${application.id}`} style={{ gap: theme.spacing.md }}>
      <Pressable
        testID={`student-application-${application.id}-university`}
        accessibilityRole="button"
        disabled={!universityId}
        onPress={() =>
          universityId &&
          nav.navigate('Universities', {
            screen: 'UniversityDetail',
            params: { universityId },
          })
        }
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Avatar
          photoUrl={application.university?.logo_url}
          name={application.university?.name}
          size={44}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" numberOfLines={2} style={{ fontSize: theme.fontSize.md }}>
            {application.university?.name ?? ''}
          </Text>
          {location ? (
            <Text variant="muted" numberOfLines={1}>
              {location}
            </Text>
          ) : null}
        </View>
        {universityId ? <ChevronRightIcon size={20} color={theme.color.textMuted} /> : null}
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
        }}
      >
        {statusName ? (
          <Badge
            label={t(`applications.status.${statusName}`, { defaultValue: statusName })}
            tone={STATUS_TONE[statusName] ?? 'neutral'}
          />
        ) : (
          <View />
        )}
        {metaKey && metaDate ? (
          <Text variant="muted" style={{ fontSize: theme.fontSize.xs }}>
            {t(metaKey, { date: metaDate })}
          </Text>
        ) : null}
      </View>

      {chipLabel ? (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: theme.color.brandSoft,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Text style={{ fontSize: theme.fontSize.xs, color: theme.color.brand }}>{chipLabel}</Text>
        </View>
      ) : null}

      <View style={{ height: 1, backgroundColor: theme.color.border }} />

      <ApplicationTimeline steps={timeline.steps} />
    </Card>
  );
}
