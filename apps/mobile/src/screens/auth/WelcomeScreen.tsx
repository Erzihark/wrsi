import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Screen,
  Text,
  Button,
  Card,
  useTheme,
  GlobeIcon,
  GraduationCapIcon,
  UsersIcon,
  MapPinIcon,
  CompassIcon,
  SearchIcon,
  ClipboardIcon,
  PlaneIcon,
  PersonIcon,
  PersonPlusIcon,
  WhatsAppIcon,
  BuildingIcon,
  StarIcon,
} from '@wrsi/ui';
import type { AuthStackParamList } from '../../navigation/types';

const stats = [
  { icon: GlobeIcon, value: '300+', labelKey: 'welcome.stats.universities' },
  { icon: GraduationCapIcon, value: '1,500+', labelKey: 'welcome.stats.students' },
  { icon: UsersIcon, value: '30+', labelKey: 'welcome.stats.highSchools' },
  { icon: MapPinIcon, value: '20+', labelKey: 'welcome.stats.countries' },
] as const;

const steps = [
  { icon: CompassIcon, labelKey: 'welcome.steps.explore' },
  { icon: SearchIcon, labelKey: 'welcome.steps.search' },
  { icon: ClipboardIcon, labelKey: 'welcome.steps.apply' },
  { icon: PlaneIcon, labelKey: 'welcome.steps.prepare' },
  { icon: UsersIcon, labelKey: 'welcome.steps.follow' },
] as const;

const partners = [
  { icon: BuildingIcon, labelKey: 'welcome.partners.highSchool' },
  { icon: GlobeIcon, labelKey: 'welcome.partners.international' },
  { icon: StarIcon, labelKey: 'welcome.partners.brand' },
] as const;

export function WelcomeScreen() {
  const t_ = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Welcome'>>();

  return (
    <Screen scroll testID="welcome-screen" style={{ gap: t_.spacing.xl }}>
      <View style={{ gap: t_.spacing.sm }}>
        <Text style={{ fontSize: t_.fontSize.xl, fontWeight: t_.fontWeight.bold, letterSpacing: 1 }}>
          <Text style={{ color: t_.color.textStrong, fontWeight: t_.fontWeight.bold, fontSize: t_.fontSize.xl }}>
            W
          </Text>
          <Text style={{ color: t_.color.primary, fontWeight: t_.fontWeight.bold, fontSize: t_.fontSize.xl }}>
            R
          </Text>
          <Text style={{ color: t_.color.textStrong, fontWeight: t_.fontWeight.bold, fontSize: t_.fontSize.xl }}>
            SI
          </Text>
        </Text>
        <Text variant="muted" style={{ letterSpacing: 1, fontWeight: t_.fontWeight.semibold }}>
          {t('welcome.tagline').toUpperCase()}
        </Text>
      </View>

      <View style={{ gap: t_.spacing.sm }}>
        <Text style={{ fontSize: t_.fontSize.xl, fontWeight: t_.fontWeight.bold, color: t_.color.textStrong }}>
          {t('welcome.headlineStart')}{' '}
          <Text style={{ fontSize: t_.fontSize.xl, fontWeight: t_.fontWeight.bold, color: t_.color.primary }}>
            {t('welcome.headlineHighlight')}
          </Text>
        </Text>
        <Text variant="muted">{t('welcome.subtitle')}</Text>
      </View>

      <View
        style={{
          backgroundColor: t_.color.brand,
          borderRadius: t_.radius.lg,
          padding: t_.spacing.lg,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {stats.map((stat, index) => (
          <View
            key={stat.labelKey}
            style={{
              width: '50%',
              alignItems: 'center',
              gap: t_.spacing.xs,
              paddingVertical: t_.spacing.sm,
              borderLeftWidth: index % 2 === 1 ? 1 : 0,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <stat.icon size={28} color={t_.color.primary} />
            <Text style={{ color: t_.color.textOnDark, fontSize: t_.fontSize.lg, fontWeight: t_.fontWeight.bold }}>
              {stat.value}
            </Text>
            <Text style={{ color: t_.color.textOnDark, fontSize: t_.fontSize.xs, textAlign: 'center' }}>
              {t(stat.labelKey)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: t_.spacing.md }}>
        <View style={{ alignItems: 'center', gap: t_.spacing.xs }}>
          <Text variant="title">{t('welcome.helpTitle')}</Text>
          <Text variant="muted" style={{ textAlign: 'center' }}>
            {t('welcome.helpSubtitle')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {steps.map((step) => (
            <View key={step.labelKey} style={{ width: '30%', alignItems: 'center', gap: t_.spacing.xs, marginBottom: t_.spacing.md }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: t_.radius.lg,
                  backgroundColor: t_.color.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <step.icon size={24} color={t_.color.brand} />
              </View>
              <Text variant="label" style={{ textAlign: 'center' }} numberOfLines={2}>
                {t(step.labelKey)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Card style={{ borderColor: t_.color.primary, flexDirection: 'row', alignItems: 'center', gap: t_.spacing.md }}>
        <WhatsAppIcon size={28} color={t_.color.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" style={{ color: t_.color.primaryDark }}>
            {t('welcome.whatsappTitle')}
          </Text>
          <Text variant="muted">{t('welcome.whatsappBody')}</Text>
        </View>
      </Card>

      <View style={{ gap: t_.spacing.sm }}>
        <Button
          testID="welcome-login"
          title={t('welcome.login')}
          icon={(color) => <PersonIcon size={18} color={color} />}
          onPress={() => navigation.navigate('Login')}
        />
        <Button
          testID="welcome-signup"
          variant="secondary"
          title={t('welcome.createAccount')}
          icon={(color) => <PersonPlusIcon size={18} color={color} />}
          onPress={() => navigation.navigate('SignUp')}
        />
      </View>

      <View
        style={{
          backgroundColor: t_.color.surfaceAlt,
          borderRadius: t_.radius.lg,
          padding: t_.spacing.lg,
          gap: t_.spacing.md,
        }}
      >
        <Text variant="title" style={{ textAlign: 'center' }}>
          {t('welcome.partnersTitle')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {partners.map((partner) => (
            <View key={partner.labelKey} style={{ width: '31%', gap: t_.spacing.xs }}>
              <partner.icon size={22} color={t_.color.brand} />
              <Text variant="muted" style={{ fontSize: t_.fontSize.xs }}>
                {t(partner.labelKey)}
              </Text>
              <Text style={{ color: t_.color.primaryDark, fontSize: t_.fontSize.xs, fontWeight: t_.fontWeight.semibold }}>
                {t('welcome.contactUs')}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text variant="muted" style={{ textAlign: 'center' }}>
        {t('welcome.footer', { year: new Date().getFullYear() })}
      </Text>
    </Screen>
  );
}
