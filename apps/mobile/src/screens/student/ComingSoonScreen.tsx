import { View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BookIcon, GraduationCapIcon, HeartIcon, Screen, Text, useTheme } from '@wrsi/ui';
import type { ComingSoonFeature, StudentHomeStackParamList } from '../../navigation/types';

const ICONS: Record<ComingSoonFeature, typeof BookIcon> = {
  learning: GraduationCapIcon,
  resources: BookIcon,
  benefits: HeartIcon,
};

/**
 * Shared destination for designed-but-unbuilt features (WRSI Learning, the
 * resources library, student benefits). Keeps the dashboard's tiles honest —
 * they lead somewhere that says "not yet" instead of nowhere.
 */
export function ComingSoonScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const route = useRoute<RouteProp<StudentHomeStackParamList, 'ComingSoon'>>();
  const feature = route.params.feature;
  const Icon = ICONS[feature];

  return (
    <Screen testID="student-coming-soon-screen">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.color.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={32} color={theme.color.primary} />
        </View>
        <Text variant="title" style={{ textAlign: 'center' }}>
          {t(`comingSoon.${feature}.title`)}
        </Text>
        <Text variant="muted" style={{ textAlign: 'center' }}>
          {t(`comingSoon.${feature}.body`)}
        </Text>
        <Text variant="muted" style={{ textAlign: 'center', color: theme.color.primaryDark }}>
          {t('comingSoon.badge')}
        </Text>
      </View>
    </Screen>
  );
}
