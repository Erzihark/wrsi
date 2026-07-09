import { ActivityIndicator, Linking, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useUniversity, useUniversityPrograms } from '@wrsi/api';
import { Button, Card, Screen, Text, useTheme } from '@wrsi/ui';
import type { StudentUniversitiesStackParamList } from '../../navigation/types';
import { SaveUniversityButton } from './SaveUniversityButton';

export function UniversityDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { universityId } =
    useRoute<RouteProp<StudentUniversitiesStackParamList, 'UniversityDetail'>>().params;

  const university = useUniversity(universityId);
  const programs = useUniversityPrograms(universityId);

  if (!university.data) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const u = university.data;

  return (
    <Screen scroll>
      <Text variant="heading">{u.name}</Text>

      <SaveUniversityButton universityId={u.id} />

      {u.website ? (
        <Button
          variant="ghost"
          title={t('universities.visitWebsite')}
          onPress={() => void Linking.openURL(u.website as string)}
        />
      ) : null}

      {u.description ? (
        <Text style={{ marginTop: theme.spacing.sm }}>{u.description}</Text>
      ) : null}

      {u.requirements ? (
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.xs }}>
          <Text variant="label">{t('universities.requirements')}</Text>
          <Text variant="muted">{u.requirements}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="label">{t('universities.programs')}</Text>
        {programs.isLoading ? (
          <ActivityIndicator color={theme.color.primary} />
        ) : programs.data && programs.data.length > 0 ? (
          programs.data.map((p) => (
            <Card key={p.id} style={{ gap: theme.spacing.xs }}>
              <Text variant="title">{p.name}</Text>
              <Text variant="muted">
                {[p.education_levels?.name, p.fields_of_study?.name, p.duration]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </Text>
            </Card>
          ))
        ) : (
          <Text variant="muted">{t('universities.noPrograms')}</Text>
        )}
      </View>
    </Screen>
  );
}
