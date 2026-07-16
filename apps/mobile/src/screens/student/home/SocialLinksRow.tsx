import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  InstagramIcon,
  LinkedInIcon,
  Text,
  TikTokIcon,
  YouTubeIcon,
  useTheme,
} from '@wrsi/ui';
import { SOCIAL_LINKS, type SocialNetwork } from '../../../config/social';

const NETWORKS: { key: SocialNetwork; label: string; Icon: typeof InstagramIcon }[] = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { key: 'youtube', label: 'YouTube', Icon: YouTubeIcon },
];

/** "Conéctate con nosotros" — the dashboard's social footer. */
export function SocialLinksRow() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
      }}
    >
      <Text variant="title" style={{ flex: 1 }}>
        {t('home.social.title')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {NETWORKS.map(({ key, label, Icon }) => (
          <Pressable
            key={key}
            accessibilityRole="link"
            accessibilityLabel={label}
            testID={`student-social-${key}`}
            hitSlop={4}
            onPress={() => void Linking.openURL(SOCIAL_LINKS[key])}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.surface,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icon size={20} color={theme.color.text} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
