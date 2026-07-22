import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  formatDayMonth,
  type ApplicationMilestone,
  type ApplicationTimelineStep,
  type DateWordsLocale,
} from '@wrsi/shared-utils';
import {
  CheckIcon,
  ClockIcon,
  GraduationCapIcon,
  SendIcon,
  Text,
  useTheme,
  type IconProps,
} from '@wrsi/ui';

const MILESTONE_ICON: Record<ApplicationMilestone, (p: IconProps) => ReactElement> = {
  started: CheckIcon,
  documents: SendIcon,
  review: ClockIcon,
  decision: GraduationCapIcon,
};

/**
 * The four-milestone tracker on an application card
 * (Iniciada → Documentos enviados → En revisión → Decisión final).
 *
 * Stays horizontal on a phone — the designer drew it as a progress rail, and a
 * vertical list loses that read. The labels are the tight part, so they run at
 * 10px over two lines; the dots and rail keep their full size so the completed
 * stretch is legible at a glance.
 */
export function ApplicationTimeline({ steps }: { steps: ApplicationTimelineStep[] }) {
  const { i18n } = useTranslation();
  const locale: DateWordsLocale = i18n.language.startsWith('es') ? 'es' : 'en';

  return (
    <View style={{ flexDirection: 'row' }}>
      {steps.map((step, index) => (
        <Milestone
          key={step.key}
          step={step}
          locale={locale}
          // The rail is drawn as two half-segments per column so it stays
          // continuous without absolute positioning: a segment is "filled" when
          // the step on its side has been reached.
          railLeft={index === 0 ? 'none' : steps[index - 1]!.state !== 'pending' ? 'on' : 'off'}
          railRight={
            index === steps.length - 1 ? 'none' : steps[index + 1]!.state !== 'pending' ? 'on' : 'off'
          }
        />
      ))}
    </View>
  );
}

type RailState = 'none' | 'on' | 'off';

function Milestone({
  step,
  locale,
  railLeft,
  railRight,
}: {
  step: ApplicationTimelineStep;
  locale: DateWordsLocale;
  railLeft: RailState;
  railRight: RailState;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const done = step.state === 'done';
  const current = step.state === 'current';
  // Done is green (a finished step), current is navy (where you are now) — the
  // full-strength brand colors are fills here, never small text, so they're
  // safe against the white card.
  const dotColor = done ? theme.color.success : current ? theme.color.brand : theme.color.surfaceAlt;
  const Icon = done ? CheckIcon : MILESTONE_ICON[step.key];

  const date = formatDayMonth(step.at, locale);

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' }}>
        <Rail state={railLeft} />
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: theme.radius.pill,
            backgroundColor: dotColor,
            borderWidth: done || current ? 0 : 2,
            borderColor: theme.color.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done || current ? <Icon size={13} color={theme.color.textOnDark} /> : null}
        </View>
        <Rail state={railRight} />
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontSize: 10,
          lineHeight: 13,
          textAlign: 'center',
          color: step.state === 'pending' ? theme.color.textMuted : theme.color.textStrong,
          fontWeight: current ? theme.fontWeight.semibold : theme.fontWeight.medium,
        }}
      >
        {t(`applications.milestone.${step.key}`)}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontSize: 10, lineHeight: 13, textAlign: 'center', color: theme.color.textMuted }}
      >
        {date ?? (step.state === 'pending' ? t('applications.milestone.pending') : t('applications.milestone.none'))}
      </Text>
    </View>
  );
}

function Rail({ state }: { state: RailState }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        height: 2,
        backgroundColor:
          state === 'none' ? 'transparent' : state === 'on' ? theme.color.success : theme.color.border,
      }}
    />
  );
}
