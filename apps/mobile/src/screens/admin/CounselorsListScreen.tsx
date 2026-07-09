import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useCounselorsList, type CounselorRow } from '@wrsi/api';
import { fullName } from '@wrsi/shared-utils';
import type { CounselorsStackParamList } from '../../navigation/types';
import { EntityListScreen } from './EntityListScreen';

type ListItem = Pick<CounselorRow, 'id' | 'first_name' | 'last_name' | 'phone'>;

export function CounselorsListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<CounselorsStackParamList, 'List'>>();
  const [search, setSearch] = useState('');
  const query = useCounselorsList(search);

  return (
    <EntityListScreen<ListItem>
      addLabel={t('admin.addCounselor')}
      searchPlaceholder={t('admin.search')}
      emptyText={t('admin.noCounselors')}
      items={query.data}
      isLoading={query.isLoading}
      search={search}
      onSearchChange={setSearch}
      keyFor={(item) => item.id}
      titleFor={(item) => fullName(item.first_name, item.last_name)}
      subtitleFor={(item) => item.phone ?? null}
      onAdd={() => nav.navigate('Detail', {})}
      onPressItem={(item) => nav.navigate('Detail', { id: item.id })}
    />
  );
}
