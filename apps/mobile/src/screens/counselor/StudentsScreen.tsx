import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useStudentsList, type StudentDirectoryRow, type StudentFilters } from '@wrsi/api';
import { fullName } from '@wrsi/shared-utils';
import { Badge, Button, Card, Input, Screen, Text, useTheme } from '@wrsi/ui';
import type { CounselorStudentsStackParamList } from '../../navigation/types';

export function StudentsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav =
    useNavigation<NativeStackNavigationProp<CounselorStudentsStackParamList, 'StudentsList'>>();

  const [search, setSearch] = useState('');
  const filters = useMemo<StudentFilters>(() => ({ search: search.trim() || undefined }), [search]);
  // RLS on the student_directory view already limits a counselor to their
  // assigned students, so no explicit counselor filter is needed here.
  const query = useStudentsList(filters);

  const rows = useMemo(
    () =>
      (query.data?.pages.flatMap((p) => p.rows) ?? []).filter(
        (r): r is StudentDirectoryRow & { id: string } => r.id != null,
      ),
    [query.data],
  );

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
        <Text variant="heading">{t('counselor.students')}</Text>
        <Input
          placeholder={t('counselor.search')}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{t('counselor.noStudents')}</Text>}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: theme.spacing.sm }}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}
              >
                <Text variant="title" style={{ flexShrink: 1 }}>
                  {fullName(item.first_name, item.last_name)}
                </Text>
                {item.status_name ? (
                  <Badge label={item.status_name} color={item.status_color ?? undefined} />
                ) : null}
              </View>
              <Text variant="muted">{item.high_school_name ?? '—'}</Text>
              <Button
                variant="secondary"
                title={t('counselor.viewStudent')}
                onPress={() => nav.navigate('StudentDetail', { studentId: item.id })}
              />
            </Card>
          )}
          ListFooterComponent={
            query.hasNextPage ? (
              <Button
                variant="secondary"
                title={t('admin.loadMore')}
                loading={query.isFetchingNextPage}
                onPress={() => void query.fetchNextPage()}
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
}
