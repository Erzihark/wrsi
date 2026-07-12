import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useHighSchoolsList, type HighSchoolRow } from '@wrsi/api';
import { fullName } from '@wrsi/shared-utils';
import type { HighSchoolsStackParamList } from '../../navigation/types';
import { useRefetchOnFocus } from '../../lib/useRefetchOnFocus';
import { EntityListScreen } from './EntityListScreen';

type ListItem = Pick<
  HighSchoolRow,
  'id' | 'name' | 'contact_first_name' | 'contact_last_name' | 'phone_number'
>;

export function HighSchoolsListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<HighSchoolsStackParamList, 'List'>>();
  const [search, setSearch] = useState('');
  const query = useHighSchoolsList(search);
  useRefetchOnFocus(query.refetch);

  return (
    <EntityListScreen<ListItem>
      addLabel={t('admin.addHighSchool')}
      addTestID="admin-add-highschool"
      searchTestID="admin-highschool-search"
      editTestID="highschool-edit"
      searchPlaceholder={t('admin.search')}
      emptyText={t('admin.noHighSchools')}
      items={query.data}
      isLoading={query.isLoading}
      search={search}
      onSearchChange={setSearch}
      keyFor={(item) => item.id}
      titleFor={(item) => item.name}
      subtitleFor={(item) =>
        item.contact_first_name
          ? fullName(item.contact_first_name, item.contact_last_name)
          : (item.phone_number ?? null)
      }
      onAdd={() => nav.navigate('Detail', {})}
      onPressItem={(item) => nav.navigate('Detail', { id: item.id })}
    />
  );
}
