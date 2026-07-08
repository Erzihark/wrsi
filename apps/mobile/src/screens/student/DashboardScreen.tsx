import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  useMyStudentProfile,
  useStudentCurrentStatus,
  useStudentStatuses,
  useStudentTasks,
} from '@wrsi/api';
import { Badge, Card, Screen, Text, useTheme } from '@wrsi/ui';
import { fullName } from '@wrsi/shared-utils';

export function DashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: student } = useMyStudentProfile();

  const statusQuery = useStudentCurrentStatus(student?.id);
  const statuses = useStudentStatuses();
  const tasks = useStudentTasks(student?.id);

  const current = statusQuery.data?.status ?? null;
  const currentSort = current?.sort_order ?? -1;
  const name = student ? fullName(student.first_name, student.last_name) : '';

  return (
    <Screen scroll>
      <Text variant="heading">{t('dashboard.welcome', { name })}</Text>

      <Card>
        <Text variant="label">{t('dashboard.currentStatus')}</Text>
        {current ? (
          <Badge label={current.name} color={current.color ?? theme.color.primary} />
        ) : (
          <Text variant="muted">{t('dashboard.noStatus')}</Text>
        )}
      </Card>

      <Card>
        <Text variant="label">{t('dashboard.progress')}</Text>
        {(statuses.data ?? []).map((s) => {
          const done = s.sort_order <= currentSort;
          const isCurrent = current?.id === s.id;
          return (
            <View
              key={s.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: theme.radius.pill,
                  backgroundColor: done ? (s.color ?? theme.color.primary) : theme.color.border,
                }}
              />
              <Text
                style={{
                  color: done ? theme.color.text : theme.color.textMuted,
                  fontWeight: isCurrent ? theme.fontWeight.semibold : theme.fontWeight.regular,
                }}
              >
                {s.name}
              </Text>
            </View>
          );
        })}
      </Card>

      <Card>
        <Text variant="label">{t('dashboard.pendingTasks')}</Text>
        {tasks.data && tasks.data.length > 0 ? (
          tasks.data.map((task) => (
            <View key={task.id} style={{ gap: 2 }}>
              <Text>{task.title}</Text>
              {task.due_date ? <Text variant="muted">{task.due_date}</Text> : null}
            </View>
          ))
        ) : (
          <Text variant="muted">{t('dashboard.noTasks')}</Text>
        )}
      </Card>
    </Screen>
  );
}
