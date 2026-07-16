import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStudentCurrentStatus, useStudentStatuses } from '@wrsi/api';
import { computeJourneyProgress } from '@wrsi/shared-utils';
import { Card, ProgressBar, TargetIcon, Text, useTheme } from '@wrsi/ui';

/**
 * "Tu viaje WRSI": the lifecycle progress bar + percent, with the current step,
 * the next step, and how many steps remain to the goal.
 */
export function JourneyCard({ studentId }: { studentId: string | undefined }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const statuses = useStudentStatuses();
  const current = useStudentCurrentStatus(studentId);

  const progress = computeJourneyProgress(statuses.data, current.data?.status?.id);

  return (
    <Card
      testID="student-journey-card"
      style={{ backgroundColor: theme.color.primarySoft, borderColor: theme.color.primarySoft, gap: theme.spacing.md }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <TargetIcon size={32} color={theme.color.primary} />
        <View style={{ flex: 1, gap: theme.spacing.sm }}>
          <Text variant="title">{t('home.journey.title')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <ProgressBar value={progress.percent / 100} style={{ flex: 1 }} />
            <Text style={{ fontWeight: theme.fontWeight.semibold }}>{progress.percent}%</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <Step label={t('home.journey.currentStep')} value={progress.currentName ?? t('home.journey.notStarted')} />
        <Divider />
        <Step label={t('home.journey.nextStep')} value={progress.nextName ?? t('home.journey.finalStep')} />
        <Divider />
        <Step
          label={t('home.journey.remainingLabel')}
          value={t(
            progress.remaining === 1 ? 'home.journey.remainingOne' : 'home.journey.remaining',
            { count: progress.remaining },
          )}
        />
      </View>
    </Card>
  );
}

function Step({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="muted" style={{ fontSize: theme.fontSize.xs }}>
        {label}
      </Text>
      <Text style={{ fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ width: 1, backgroundColor: theme.color.border }} />;
}
