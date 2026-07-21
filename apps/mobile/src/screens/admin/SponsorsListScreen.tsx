import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSponsorsList } from '@wrsi/api';
import type { SponsorsStackParamList } from '../../navigation/types';
import { useRefetchOnFocus } from '../../lib/useRefetchOnFocus';
import { EntityListScreen } from './EntityListScreen';

type ListItem = {
  id: string;
  name: string;
  email: string | null;
  industries: { name: string } | null;
  statuses: { name: string; color: string | null } | null;
};

export function SponsorsListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<SponsorsStackParamList, 'List'>>();
  const [search, setSearch] = useState('');
  const query = useSponsorsList(search);
  useRefetchOnFocus(query.refetch);

  return (
    <EntityListScreen<ListItem>
      addLabel={t('admin.addSponsor')}
      addTestID="admin-add-sponsor"
      searchTestID="admin-sponsor-search"
      editTestID="sponsor-edit"
      searchPlaceholder={t('admin.search')}
      emptyText={t('admin.noSponsors')}
      items={query.data}
      isLoading={query.isLoading}
      search={search}
      onSearchChange={setSearch}
      keyFor={(item) => item.id}
      titleFor={(item) => item.name}
      subtitleFor={(item) => item.industries?.name ?? item.email ?? null}
      onAdd={() => nav.navigate('Detail', {})}
      onPressItem={(item) => nav.navigate('Detail', { id: item.id })}
    />
  );
}
