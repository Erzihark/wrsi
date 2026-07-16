import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Card, ChevronRightIcon, PlayIcon, SectionHeader, Text, useTheme } from '@wrsi/ui';
import type { StudentHomeStackParamList } from '../../../navigation/types';

/**
 * "Recurso destacado". The resources library is a later phase, so the card is a
 * static teaser — every affordance routes to the coming-soon screen rather than
 * pretending to play something.
 */
export function FeaturedResourceCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentHomeStackParamList>>();

  const open = () => nav.navigate('ComingSoon', { feature: 'resources' });

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <SectionHeader
        title={t('home.featured.title')}
        actionLabel={t('home.seeAll')}
        actionTestID="student-featured-see-all"
        onActionPress={open}
      />
      <Pressable
        testID="student-featured-card"
        accessibilityRole="button"
        onPress={open}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View
            style={{
              width: 84,
              height: 56,
              borderRadius: theme.radius.sm,
              overflow: 'hidden',
              backgroundColor: theme.color.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.color.background,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlayIcon size={14} color={theme.color.primary} />
            </View>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label">{t('home.featured.sampleTitle')}</Text>
            <Text variant="muted" style={{ fontSize: theme.fontSize.xs }}>
              {t('home.featured.sampleMeta')}
            </Text>
          </View>
          <ChevronRightIcon size={18} color={theme.color.textMuted} />
        </Card>
      </Pressable>
    </View>
  );
}
