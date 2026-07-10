import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useUniversitiesList, type UniversityRow } from '@wrsi/api';
import type { UniversitiesStackParamList } from '../../navigation/types';
import { useRefetchOnFocus } from '../../lib/useRefetchOnFocus';
import { EntityListScreen } from './EntityListScreen';

type ListItem = Pick<UniversityRow, 'id' | 'name' | 'website'>;

export function UniversitiesListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<UniversitiesStackParamList, 'List'>>();
  const [search, setSearch] = useState('');
  const query = useUniversitiesList(search);
  useRefetchOnFocus(query.refetch);

  return (
    <EntityListScreen<ListItem>
      addLabel={t('admin.addUniversity')}
      addTestID="admin-add-university"
      searchPlaceholder={t('admin.search')}
      emptyText={t('admin.noUniversities')}
      items={query.data}
      isLoading={query.isLoading}
      search={search}
      onSearchChange={setSearch}
      keyFor={(item) => item.id}
      titleFor={(item) => item.name}
      subtitleFor={(item) => item.website ?? null}
      onAdd={() => nav.navigate('Detail', {})}
      onPressItem={(item) => nav.navigate('Detail', { id: item.id })}
    />
  );
}
