import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useUniversities } from '@wrsi/api';
import { Card, Input, Screen, Text, useTheme } from '@wrsi/ui';
import type { StudentUniversitiesStackParamList } from '../../navigation/types';
import { SaveUniversityButton } from './SaveUniversityButton';

export function UniversitiesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav =
    useNavigation<NativeStackNavigationProp<StudentUniversitiesStackParamList, 'UniversitiesList'>>();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useUniversities(search);

  return (
    <Screen>
      <Text variant="heading">{t('student.universities')}</Text>
      <Input
        placeholder={t('universities.search')}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        style={{ marginBottom: theme.spacing.sm }}
      />
      {isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{t('universities.empty')}</Text>}
          renderItem={({ item }) => (
            <Card style={{ gap: theme.spacing.sm }}>
              <Text
                variant="title"
                onPress={() => nav.navigate('UniversityDetail', { universityId: item.id })}
              >
                {item.name}
              </Text>
              {item.description ? (
                <Text variant="muted" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <SaveUniversityButton universityId={item.id} />
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
