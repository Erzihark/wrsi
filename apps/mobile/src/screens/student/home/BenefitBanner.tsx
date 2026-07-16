import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ChevronRightIcon, Text, useTheme } from '@wrsi/ui';
import type { StudentHomeStackParamList } from '../../../navigation/types';

/**
 * Student-benefit / sponsor banner. The benefits system (partner CRUD, targeting,
 * redemption) is a later phase — this renders the designed slot with placeholder
 * content so the layout is real, and routes to the coming-soon screen instead of
 * a dead end. Replace the hard-coded copy with the benefits API when it lands.
 */
export function BenefitBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentHomeStackParamList>>();

  return (
    <Pressable
      testID="student-benefit-banner"
      accessibilityRole="button"
      onPress={() => nav.navigate('ComingSoon', { feature: 'benefits' })}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          backgroundColor: theme.color.text,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: theme.color.primary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.semibold,
            }}
          >
            {t('home.benefit.eyebrow')}
          </Text>
          <Text
            style={{
              color: theme.color.primaryText,
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.bold,
            }}
          >
            {t('home.benefit.placeholderTitle')}
          </Text>
          <Text style={{ color: theme.color.border, fontSize: theme.fontSize.xs }}>
            {t('home.benefit.placeholderDetail')}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            backgroundColor: theme.color.primary,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              color: theme.color.primaryText,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
            }}
          >
            {t('home.benefit.cta')}
          </Text>
          <ChevronRightIcon size={14} color={theme.color.primaryText} />
        </View>
      </View>
    </Pressable>
  );
}
