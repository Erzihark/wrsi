import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useIndustries, useSponsorsList, useStatuses, type SponsorFilters } from '@wrsi/api';
import { Badge, Button, Card, Input, Screen, SearchSelect, Text, useTheme } from '@wrsi/ui';
import type { SponsorsStackParamList } from '../../navigation/types';
import { useRefetchOnFocus } from '../../lib/useRefetchOnFocus';

type ListItem = {
  id: string;
  name: string;
  email: string | null;
  industries: { name: string } | null;
  statuses: { name: string; color: string | null } | null;
};

const EMPTY_FILTERS: SponsorFilters = {};

/**
 * Bespoke list (not the generic `EntityListScreen`, which only offers name
 * search) since sponsors also filter by status/industry — same reason
 * `StudentsListScreen` keeps its own richer filter UI.
 */
export function SponsorsListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<SponsorsStackParamList, 'List'>>();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SponsorFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const industries = useIndustries();
  const statuses = useStatuses('sponsor');

  const effectiveFilters = useMemo<SponsorFilters>(
    () => ({ ...filters, search: search.trim() || undefined }),
    [filters, search],
  );
  const query = useSponsorsList(effectiveFilters);
  useRefetchOnFocus(query.refetch);

  const items: ListItem[] = query.data ?? [];

  const industryOptions = (industries.data ?? []).map((i) => ({ label: i.name, value: i.id }));
  const statusOptions = (statuses.data ?? []).map((s) => ({ label: s.name, value: s.id }));

  function applyFilterChange(next: SponsorFilters) {
    setFilters(next);
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
        <Input
          placeholder={t('admin.search')}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          testID="admin-sponsor-search"
        />
        <Button
          title={t('admin.addSponsor')}
          onPress={() => nav.navigate('Detail', {})}
          testID="admin-add-sponsor"
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="ghost"
            title={`${showFilters ? '▾' : '▸'} ${t('admin.filters')}`}
            onPress={() => setShowFilters((s) => !s)}
            testID="admin-sponsor-filters-toggle"
          />
          <Text variant="muted">{t('admin.sponsorsCount', { count: items.length })}</Text>
        </View>

        {showFilters && (
          <Card style={{ gap: theme.spacing.md }}>
            <SearchSelect
              label={t('admin.status')}
              placeholder={t('admin.anyStatus')}
              options={statusOptions}
              value={filters.statusId ?? null}
              onChange={(v) => applyFilterChange({ ...filters, statusId: v })}
              testID="admin-sponsor-status-filter"
            />
            <SearchSelect
              label={t('admin.industry')}
              placeholder={t('admin.anyIndustry')}
              options={industryOptions}
              value={filters.industryId ?? null}
              onChange={(v) => applyFilterChange({ ...filters, industryId: v })}
              testID="admin-sponsor-industry-filter"
            />
            <Button
              variant="ghost"
              title={t('admin.clearFilters')}
              onPress={() => {
                setSearch('');
                applyFilterChange(EMPTY_FILTERS);
              }}
              testID="admin-sponsor-clear-filters"
            />
          </Card>
        )}
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{t('admin.noSponsors')}</Text>}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: theme.spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: theme.spacing.sm,
                }}
              >
                <Text variant="title" style={{ flexShrink: 1 }}>
                  {item.name}
                </Text>
                {item.statuses ? (
                  <Badge label={item.statuses.name} color={item.statuses.color ?? undefined} />
                ) : null}
              </View>
              <Text variant="muted">{item.industries?.name ?? item.email ?? null}</Text>
              <Button
                variant="secondary"
                title={t('admin.edit')}
                onPress={() => nav.navigate('Detail', { id: item.id })}
                testID="sponsor-edit"
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
