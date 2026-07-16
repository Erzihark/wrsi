import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  BookIcon,
  FileTextIcon,
  FolderIcon,
  GraduationCapIcon,
  IconTile,
  Text,
  useTheme,
} from '@wrsi/ui';
import type { StudentHomeStackParamList, StudentTabParamList } from '../../../navigation/types';

/**
 * "Accesos rápidos": WRSI Learning (future phase → coming soon), My Apps,
 * Universidades (jumps tabs), and Documentos (which left the tab bar and now
 * lives in this stack).
 */
export function QuickAccessGrid() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentHomeStackParamList>>();

  function parent() {
    return nav.getParent<BottomTabNavigationProp<StudentTabParamList>>();
  }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="title">{t('home.quickAccess.title')}</Text>
      {/* flex:1 per tile — RN defaults flexShrink to 0, so content-sized tiles
          would overflow the row once the labels are translated. */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        <IconTile
          testID="student-quick-learning"
          icon={(c) => <GraduationCapIcon size={26} color={c} />}
          label={t('home.quickAccess.learning')}
          onPress={() => nav.navigate('ComingSoon', { feature: 'learning' })}
          style={{ flex: 1 }}
        />
        <IconTile
          testID="student-quick-applications"
          icon={(c) => <FileTextIcon size={26} color={c} />}
          label={t('home.quickAccess.applications')}
          onPress={() => nav.navigate('Applications')}
          style={{ flex: 1 }}
        />
        <IconTile
          testID="student-quick-universities"
          icon={(c) => <BookIcon size={26} color={c} />}
          label={t('home.quickAccess.universities')}
          onPress={() => parent()?.navigate('Universities', { screen: 'UniversitiesList' })}
          style={{ flex: 1 }}
        />
        <IconTile
          testID="student-quick-documents"
          icon={(c) => <FolderIcon size={26} color={c} />}
          label={t('home.quickAccess.documents')}
          onPress={() => nav.navigate('Documents')}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
