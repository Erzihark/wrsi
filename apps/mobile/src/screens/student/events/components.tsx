import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EventPhase, RequestStatus } from '@wrsi/shared-utils';
import { formatDayMonthYear, formatGeography, formatTimeRange } from '@wrsi/shared-utils';
import {
  Badge,
  Card,
  ChevronRightIcon,
  MapPinIcon,
  StarIcon,
  Text,
  useTheme,
  type BadgeTone,
} from '@wrsi/ui';
import { CalendarIcon, GraduationCapIcon } from '@wrsi/ui';
import type { InterestLevel } from '@wrsi/api';

/** Navy phase chip: Evento principal / En curso / Evento finalizado. */
export function EventPhaseBadge({ phase }: { phase: EventPhase }) {
  const { t } = useTranslation();
  // The comp colors these orange / blue / purple. Purple isn't in the brand
  // palette, so the finished state reads as neutral gray — see PROGRESS.md.
  const tones: Record<EventPhase, BadgeTone> = {
    upcoming: 'primary',
    live: 'brand',
    past: 'neutral',
  };
  return <Badge label={t(`eventDetail.phase.${phase}`)} tone={tones[phase]} />;
}

export interface EventHeroProps {
  title: string;
  phase: EventPhase;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  country: { name: string; name_es: string | null } | null;
  state: { name: string } | null;
  universityCount: number;
  spanish: boolean;
}

/**
 * The comp's navy header block: phase chip, event title, then a meta row of
 * dates / place / university count.
 *
 * The comp lays the meta out as one horizontal line of three items. In Spanish
 * that line is ~55 characters ("9 – 15 Nov, 2026 · Mérida, Yucatán · 32
 * universidades") which cannot fit 328px at 14px, so it wraps to full-width
 * rows instead — DESIGN.md §1.4.
 */
export function EventHero({
  title,
  phase,
  startDate,
  endDate,
  startTime,
  endTime,
  venue,
  country,
  state,
  universityCount,
  spanish,
}: EventHeroProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const locale = spanish ? 'es' : 'en';

  const from = formatDayMonthYear(startDate, locale);
  const to = endDate && endDate !== startDate ? formatDayMonthYear(endDate, locale) : null;
  const dates = from ? (to ? `${from} – ${to}` : from) : null;
  const time = formatTimeRange(startTime, endTime);
  const place = [venue, formatGeography(country, state, spanish)].filter(Boolean).join(' · ');

  const meta: { icon: ReactNode; label: string }[] = [];
  if (dates) {
    meta.push({
      icon: <CalendarIcon size={16} color={theme.color.textOnDark} />,
      label: time ? `${dates} · ${time}` : dates,
    });
  }
  if (place) {
    meta.push({ icon: <MapPinIcon size={16} color={theme.color.textOnDark} />, label: place });
  }
  if (universityCount > 0) {
    meta.push({
      icon: <GraduationCapIcon size={16} color={theme.color.textOnDark} />,
      label: t('eventDetail.universitiesCount', { count: universityCount }),
    });
  }

  return (
    <View
      testID="event-hero"
      style={{
        backgroundColor: theme.color.brand,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
      }}
    >
      <EventPhaseBadge phase={phase} />
      <Text variant="title" style={{ color: theme.color.textOnDark }}>
        {title}
      </Text>
      {meta.map((row, index) => (
        <View
          key={index}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}
        >
          <View style={{ paddingTop: 2 }}>{row.icon}</View>
          <Text
            style={{ flex: 1, color: theme.color.textOnDark, fontSize: theme.fontSize.sm }}
          >
            {row.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export interface NavRowProps {
  icon: (color: string) => ReactNode;
  title: string;
  body: string;
  onPress: () => void;
  testID?: string;
  /** Icon tint; defaults to the brand navy. */
  color?: string;
  /** Optional trailing count/badge, e.g. approved workshops. */
  badge?: string;
}

/**
 * One full-width destination row — icon chip, title, one-line description,
 * chevron.
 *
 * The comp renders the "during the event" set as a 2×2 grid of tiles. Those
 * tiles carry full Spanish sentences ("Toma notas y ordena tus favoritas"),
 * which at two-across on a 360px screen leaves ~140px per cell. Rows are used
 * for all three phases instead — the same treatment the comp already uses
 * before and after the event. DESIGN.md §1.4.
 */
export function NavRow({ icon, title, body, onPress, testID, color, badge }: NavRowProps) {
  const theme = useTheme();
  const tint = color ?? theme.color.brand;

  return (
    <Pressable accessibilityRole="button" testID={testID} onPress={onPress}>
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
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon(tint)}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
              {title}
            </Text>
            {/* No numberOfLines: these are full sentences and must reflow at
                130% OS font scale rather than clip. DESIGN.md §1.3. */}
            <Text variant="muted">{body}</Text>
          </View>
          {badge ? <Badge label={badge} tone="brand" /> : null}
          <ChevronRightIcon size={20} color={theme.color.textMuted} />
        </Card>
      )}
    </Pressable>
  );
}

const STATUS_TONES: Record<RequestStatus, BadgeTone> = {
  pending: 'accent',
  approved: 'success',
  rejected: 'danger',
};

/** Pendiente / Aprobado / Rechazado. */
export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  return <Badge label={t(`eventDetail.requestStatus.${status}`)} tone={STATUS_TONES[status]} />;
}

export interface InterestStarProps {
  level: InterestLevel | null;
  onPress: () => void;
  testID?: string;
  size?: number;
}

/**
 * The ☆/★ control from the comp's university list, cycling
 * none → Interesada → Favorita → none.
 *
 * Drawn with the bundled `StarIcon` rather than ⭐ (U+2B50), which Android's
 * font fallback renders as a color emoji that ignores `color` — CLAUDE.md's
 * platform-parity rule.
 */
export function InterestStar({ level, onPress, testID, size = 22 }: InterestStarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const label =
    level === 'favorite'
      ? t('eventDetail.universities.unmark')
      : level === 'interested'
        ? t('eventDetail.universities.markFavorite')
        : t('eventDetail.universities.markInterested');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: level != null }}
      testID={testID}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => ({ padding: theme.spacing.xs, opacity: pressed ? 0.6 : 1 })}
    >
      <StarIcon
        size={size}
        filled={level === 'favorite'}
        // Amber is the brand's "logros/destacados" color, but at full strength
        // it fails AA as a small outline; the unmarked state uses muted gray.
        color={level ? theme.color.accentDark : theme.color.textMuted}
      />
    </Pressable>
  );
}

/** Shared empty state inside a card. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card>
      <Text variant="muted">{title}</Text>
      {hint ? <Text variant="muted">{hint}</Text> : null}
    </Card>
  );
}
