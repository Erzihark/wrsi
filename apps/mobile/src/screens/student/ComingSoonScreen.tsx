import { View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  BellIcon,
  BookIcon,
  CompassIcon,
  FolderIcon,
  GraduationCapIcon,
  HeartIcon,
  Screen,
  Text,
  useTheme,
} from '@wrsi/ui';
import type { ComingSoonFeature } from '../../navigation/types';

const ICONS: Record<ComingSoonFeature, typeof BookIcon> = {
  learning: GraduationCapIcon,
  resources: BookIcon,
  benefits: HeartIcon,
  eventUpdates: BellIcon,
  eventDocuments: FolderIcon,
  eventNextSteps: CompassIcon,
};

/**
 * Shared destination for designed-but-unbuilt features (WRSI Learning, the
 * resources library, student benefits, and three rows of the event design).
 * Keeps the tiles honest — they lead somewhere that says "not yet" instead of
 * nowhere.
 *
 * The route type is declared locally rather than borrowing one stack's param
 * list: this screen is registered in both the Home and Events stacks, and both
 * pass the same single param.
 */
type ComingSoonRoute = RouteProp<{ ComingSoon: { feature: ComingSoonFeature } }, 'ComingSoon'>;

export function ComingSoonScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const route = useRoute<ComingSoonRoute>();
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
