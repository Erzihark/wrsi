import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  useCounselors,
  useCountries,
  useHighSchools,
  useStudentsList,
  useStudentStatuses,
  type StudentDirectoryRow,
  type StudentFilters,
} from '@wrsi/api';
import { fullName } from '@wrsi/shared-utils';
import {
  Badge,
  Button,
  Card,
  Input,
  Screen,
  SearchSelect,
  Text,
  useTheme,
} from '@wrsi/ui';
import type { StudentsStackParamList } from '../../navigation/types';
import { useRefetchOnFocus } from '../../lib/useRefetchOnFocus';

const EMPTY_FILTERS: StudentFilters = {};

export function StudentsListScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentsStackParamList, 'StudentsList'>>();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const counselors = useCounselors();
  const highSchools = useHighSchools();
  const statuses = useStudentStatuses();
  const countries = useCountries();

  const effectiveFilters = useMemo<StudentFilters>(
    () => ({ ...filters, search: search.trim() || undefined }),
    [filters, search],
  );
  const query = useStudentsList(effectiveFilters);
  useRefetchOnFocus(query.refetch);

  // The view types every column nullable; id is the students PK and never null,
  // so narrow it for keys/navigation.
  const shownRows = useMemo(
    () =>
      (query.data?.pages.flatMap((p) => p.rows) ?? []).filter(
        (r): r is StudentDirectoryRow & { id: string } => r.id != null,
      ),
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  function applyFilterChange(next: StudentFilters) {
    setFilters(next);
  }

  const isEs = i18n.language.startsWith('es');
  const countryLabel = (c: { name: string; name_es: string | null }) =>
    (isEs ? c.name_es : null) ?? c.name;

  const counselorOptions = (counselors.data ?? []).map((c) => ({
    label: fullName(c.first_name, c.last_name),
    value: c.id,
  }));
  const highSchoolOptions = (highSchools.data ?? []).map((h) => ({
    label: h.name,
    value: h.id,
  }));
  const statusOptions = (statuses.data ?? []).map((s) => ({ label: s.name, value: s.id }));
  const countryOptions = (countries.data ?? []).map((c) => ({
    label: countryLabel(c),
    value: c.id,
  }));
  const gradYears = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 3 + i);
  const yearOptions = gradYears.map((y) => ({ label: String(y), value: y }));

  function renderItem({ item }: { item: StudentDirectoryRow & { id: string } }) {
    return (
      <Card style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
          <Text variant="title" style={{ flexShrink: 1 }}>
            {fullName(item.first_name, item.last_name)}
          </Text>
          {item.status_name ? (
            <Badge label={item.status_name} color={item.status_color ?? theme.color.primary} />
          ) : null}
        </View>
        <Text variant="muted">
          {item.high_school_name ?? '—'}
          {' · '}
          {item.counselor_first_name
            ? fullName(item.counselor_first_name, item.counselor_last_name)
            : t('admin.unassigned')}
        </Text>
        <Button
          variant="secondary"
          title={t('admin.editStudent')}
          onPress={() => nav.navigate('StudentDetail', { studentId: item.id })}
        />
      </Card>
    );
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
        <Input
          placeholder={t('admin.search')}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <Button
          title={t('admin.addStudent')}
          onPress={() => nav.navigate('StudentDetail', {})}
          testID="admin-add-student"
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="ghost"
            title={`${showFilters ? '▾' : '▸'} ${t('admin.filters')}`}
            onPress={() => setShowFilters((s) => !s)}
          />
          <Text variant="muted">{t('admin.resultsCount', { count: total })}</Text>
        </View>

        {showFilters && (
          <Card style={{ gap: theme.spacing.md }}>
            <SearchSelect
              label={t('admin.assignedCounselor')}
              placeholder={t('admin.anyCounselor')}
              options={counselorOptions}
              value={filters.counselorId ?? null}
              onChange={(v) => applyFilterChange({ ...filters, counselorId: v })}
            />
            <SearchSelect
              label={t('admin.highSchool')}
              placeholder={t('admin.anyHighSchool')}
              options={highSchoolOptions}
              value={filters.highSchoolId ?? null}
              onChange={(v) => applyFilterChange({ ...filters, highSchoolId: v })}
            />
            <SearchSelect
              label={t('admin.status')}
              placeholder={t('admin.anyStatus')}
              options={statusOptions}
              value={filters.statusId ?? null}
              onChange={(v) => applyFilterChange({ ...filters, statusId: v })}
            />
            <SearchSelect
              label={t('admin.graduationYear')}
              placeholder={t('admin.anyYear')}
              options={yearOptions}
              value={filters.graduationYear ?? null}
              onChange={(v) => applyFilterChange({ ...filters, graduationYear: v })}
            />
            <SearchSelect
              label={t('admin.nationality')}
              placeholder={t('admin.anyCountry')}
              options={countryOptions}
              value={filters.countryId ?? null}
              onChange={(v) => applyFilterChange({ ...filters, countryId: v })}
            />
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('admin.budgetMin')}
                  keyboardType="numeric"
                  value={filters.budgetMin != null ? String(filters.budgetMin) : ''}
                  onChangeText={(v) =>
                    applyFilterChange({ ...filters, budgetMin: v ? Number(v) : null })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('admin.budgetMax')}
                  keyboardType="numeric"
                  value={filters.budgetMax != null ? String(filters.budgetMax) : ''}
                  onChangeText={(v) =>
                    applyFilterChange({ ...filters, budgetMax: v ? Number(v) : null })
                  }
                />
              </View>
            </View>
            <Button
              variant="ghost"
              title={t('admin.clearFilters')}
              onPress={() => {
                setSearch('');
                applyFilterChange(EMPTY_FILTERS);
              }}
            />
          </Card>
        )}
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={shownRows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{t('admin.noStudents')}</Text>}
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
