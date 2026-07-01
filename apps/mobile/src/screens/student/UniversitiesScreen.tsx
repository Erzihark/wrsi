import { FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUniversities } from '@wrsi/api';
import { Screen, Text, Card } from '@wrsi/ui';

export function UniversitiesScreen() {
  const { t } = useTranslation();
  const { data, isLoading } = useUniversities();

  return (
    <Screen>
      <Text variant="heading">{t('student.universities')}</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Card>
            <Text variant="title">{item.name}</Text>
            {item.description ? <Text variant="muted">{item.description}</Text> : null}
          </Card>
        )}
        ListEmptyComponent={
          <Text variant="muted">{isLoading ? t('common.loading') : '—'}</Text>
        }
      />
    </Screen>
  );
}
