import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

/**
 * The signed-out landing screen.
 *
 * Two deliberate departures from the desktop comp, both forced by phone
 * ergonomics:
 *
 * - **The CTAs are pinned, not inline.** In the comp they sit after the stats
 *   and the process strip, which on a 640px-tall phone puts the primary action
 *   several screens down. They live in a sticky bar instead, so logging in is
 *   always a single tap regardless of device height or how far the marketing
 *   copy has been scrolled.
 * - **The icon strips are vertical lists, not columns.** The comp's 4-across
 *   stats row and 5-across process strip leave ~30% of the width per label,
 *   which truncates the Spanish strings ("Exploración y perfilamiento",
 *   "Seguimiento personalizado") on a small screen. Stats become a 2×2 grid and
 *   the process/partner sections become full-width rows, so nothing is clamped
 *   and OS font scaling can grow the text without cutting it off.
 */
export function WelcomeScreen() {
  const t_ = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Welcome'>>();

  const wordmarkChar = {
    fontSize: 42,
    fontWeight: t_.fontWeight.bold,
    letterSpacing: 2,
  } as const;

  return (
    <Screen testID="welcome-screen" style={{ padding: 0, gap: 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          // The header is hidden on this screen, so the status bar inset is ours to pay.
          paddingTop: insets.top + t_.spacing.lg,
          paddingHorizontal: t_.spacing.lg,
          paddingBottom: t_.spacing.xl,
          gap: t_.spacing.xl,
        }}
      >
        <View style={{ gap: t_.spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: t_.spacing.xs }}>
              {/* The outer Text carries the wordmark's metrics too: Android sizes the
                  line box from the parent, and a 16px default would clip the 42px children. */}
              <Text style={{ ...wordmarkChar, lineHeight: 50 }}>
                <Text style={{ ...wordmarkChar, color: t_.color.textStrong }}>W</Text>
                <Text style={{ ...wordmarkChar, color: t_.color.primary }}>R</Text>
                <Text style={{ ...wordmarkChar, color: t_.color.textStrong }}>SI</Text>
              </Text>
              <Text
                style={{
                  color: t_.color.textMuted,
                  fontSize: t_.fontSize.xs,
                  fontWeight: t_.fontWeight.semibold,
                  letterSpacing: 1.5,
                }}
              >
                {t('welcome.tagline').toUpperCase()}
              </Text>
            </View>
            <PlaneIcon size={34} color={t_.color.primary} />
          </View>

          <View style={{ gap: t_.spacing.sm }}>
            <Text
              style={{
                fontSize: t_.fontSize.xl,
                lineHeight: 36,
                fontWeight: t_.fontWeight.bold,
                color: t_.color.textStrong,
              }}
            >
              {t('welcome.headlineStart')}{' '}
              <Text
                style={{
                  fontSize: t_.fontSize.xl,
                  fontWeight: t_.fontWeight.bold,
                  color: t_.color.primary,
                }}
              >
                {t('welcome.headlineHighlight')}
              </Text>
            </Text>
            <Text style={{ lineHeight: 24 }}>{t('welcome.subtitle')}</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: t_.color.brand,
            borderRadius: t_.radius.lg,
            paddingVertical: t_.spacing.lg,
            paddingHorizontal: t_.spacing.sm,
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
                paddingVertical: t_.spacing.md,
                paddingHorizontal: t_.spacing.sm,
                borderLeftWidth: index % 2 === 1 ? 1 : 0,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <stat.icon size={30} color={t_.color.primary} />
              <Text
                style={{
                  color: t_.color.textOnDark,
                  fontSize: 24,
                  fontWeight: t_.fontWeight.bold,
                }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  color: t_.color.textOnDark,
                  fontSize: t_.fontSize.sm,
                  textAlign: 'center',
                  lineHeight: 19,
                }}
              >
                {t(stat.labelKey)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: t_.spacing.lg }}>
          <View style={{ gap: t_.spacing.xs }}>
            <Text variant="title">{t('welcome.helpTitle')}</Text>
            <Text variant="muted">{t('welcome.helpSubtitle')}</Text>
          </View>
          <View style={{ gap: t_.spacing.md }}>
            {steps.map((step) => (
              <View
                key={step.labelKey}
                style={{ flexDirection: 'row', alignItems: 'center', gap: t_.spacing.md }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: t_.radius.md,
                    backgroundColor: t_.color.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <step.icon size={24} color={t_.color.brand} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: t_.color.textStrong,
                    fontWeight: t_.fontWeight.medium,
                    lineHeight: 22,
                  }}
                >
                  {t(step.labelKey)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Card
          style={{
            borderColor: t_.color.primary,
            flexDirection: 'row',
            alignItems: 'center',
            gap: t_.spacing.md,
          }}
        >
          <WhatsAppIcon size={30} color={t_.color.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                color: t_.color.primaryDark,
                fontWeight: t_.fontWeight.semibold,
              }}
            >
              {t('welcome.whatsappTitle')}
            </Text>
            <Text variant="muted" style={{ lineHeight: 20 }}>
              {t('welcome.whatsappBody')}
            </Text>
          </View>
        </Card>

        <View
          style={{
            backgroundColor: t_.color.surfaceAlt,
            borderRadius: t_.radius.lg,
            padding: t_.spacing.lg,
            gap: t_.spacing.lg,
          }}
        >
          <Text variant="title">{t('welcome.partnersTitle')}</Text>
          {partners.map((partner) => (
            <View
              key={partner.labelKey}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t_.spacing.md }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: t_.radius.md,
                  backgroundColor: t_.color.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <partner.icon size={22} color={t_.color.brand} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: t_.fontSize.sm, lineHeight: 19 }}>
                  {t(partner.labelKey)}
                </Text>
                <Text
                  style={{
                    color: t_.color.primaryDark,
                    fontSize: t_.fontSize.sm,
                    fontWeight: t_.fontWeight.semibold,
                  }}
                >
                  {t('welcome.contactUs')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text variant="muted" style={{ textAlign: 'center' }}>
          {t('welcome.footer', { year: new Date().getFullYear() })}
        </Text>
      </ScrollView>

      <View
        style={{
          backgroundColor: t_.color.surface,
          borderTopWidth: 1,
          borderTopColor: t_.color.border,
          paddingHorizontal: t_.spacing.lg,
          paddingTop: t_.spacing.md,
          // Clears the home indicator on iOS; falls back to normal padding elsewhere.
          paddingBottom: Math.max(insets.bottom, t_.spacing.md),
          gap: t_.spacing.sm,
        }}
      >
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
    </Screen>
  );
}
