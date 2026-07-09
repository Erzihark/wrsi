import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useEventsAdminList } from '@wrsi/api';
import type { AdminEventsStackParamList } from '../../navigation/types';
import { EntityListScreen } from './EntityListScreen';

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  return end && end !== start ? `${start} – ${end}` : start;
}

export function EventsListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<AdminEventsStackParamList, 'List'>>();
  const [search, setSearch] = useState('');
  const query = useEventsAdminList(search);

  return (
    <EntityListScreen
      addLabel={t('admin.addEvent')}
      searchPlaceholder={t('admin.search')}
      emptyText={t('admin.noEvents')}
      items={query.data}
      isLoading={query.isLoading}
      search={search}
      onSearchChange={setSearch}
      keyFor={(item) => item.id}
      titleFor={(item) => item.title}
      subtitleFor={(item) => [formatDateRange(item.start_date, item.end_date), item.location].filter(Boolean).join(' · ') || null}
      onAdd={() => nav.navigate('Detail', {})}
      onPressItem={(item) => nav.navigate('Detail', { id: item.id })}
    />
  );
}
