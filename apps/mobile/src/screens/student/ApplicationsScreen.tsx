import { ActivityIndicator, FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMyApplications } from '@wrsi/api';
import { intakeTermLabel } from '@wrsi/shared-utils';
import { Avatar, Badge, Card, Screen, Text, useTheme } from '@wrsi/ui';

/**
 * "My Apps" — the student's university applications, reached from the dashboard's
 * quick-access grid. Read-only: applications are created and advanced by staff,
 * so this screen reports state rather than offering actions.
 */
export function ApplicationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const applications = useMyApplications();

  return (
    <Screen testID="student-applications-screen">
      {applications.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={applications.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={
            <Card>
              <Text variant="muted">{t('applications.empty')}</Text>
              <Text variant="muted">{t('applications.emptyHint')}</Text>
            </Card>
          }
          renderItem={({ item }) => {
            const intake = [
              item.intake_term ? intakeTermLabel(item.intake_term) : null,
              item.intake_year,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                <Avatar photoUrl={item.university?.logo_url} name={item.university?.name} size={44} />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <Text variant="label">{item.university?.name ?? ''}</Text>
                  {intake ? <Text variant="muted">{intake}</Text> : null}
                </View>
                {item.status ? (
                  <Badge label={item.status.name} color={item.status.color ?? theme.color.primary} />
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
