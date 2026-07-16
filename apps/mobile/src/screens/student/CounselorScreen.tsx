import { ActivityIndicator, Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMyCounselor } from '@wrsi/api';
import { fullName, waChatUrl } from '@wrsi/shared-utils';
import { Avatar, Button, Card, Screen, Text, WhatsAppIcon, useTheme } from '@wrsi/ui';

/**
 * The "Consejero" tab: the student's assigned counselor and how to reach them.
 * Contact is WhatsApp-only for now (product decision) — in-app chat is a later
 * phase, so this screen is a contact card, not a conversation.
 */
export function CounselorScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const counselor = useMyCounselor();

  if (counselor.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  if (!counselor.data) {
    return (
      <Screen testID="student-counselor-screen">
        <Card>
          <Text variant="muted">{t('counselorScreen.unassigned')}</Text>
        </Card>
      </Screen>
    );
  }

  const person = counselor.data;
  const name = fullName(person.first_name, person.last_name);
  const chatUrl = waChatUrl(person.phone);

  return (
    <Screen testID="student-counselor-screen">
      {/* Title comes from the tab header. */}
      <Card style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl }}>
        <Avatar photoUrl={person.photo_url} name={name} size={96} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text variant="title">{name}</Text>
          <Text variant="muted">{t('counselorScreen.role')}</Text>
        </View>

        {chatUrl ? (
          <Button
            testID="student-counselor-whatsapp"
            title={t('counselorScreen.openChat')}
            icon={(c) => <WhatsAppIcon size={16} color={c} />}
            onPress={() => void Linking.openURL(chatUrl)}
            style={{ alignSelf: 'stretch' }}
          />
        ) : (
          // Phone missing or unparseable — don't offer a CTA that opens a dead chat.
          <Text variant="muted" style={{ textAlign: 'center' }}>
            {t('counselorScreen.noPhone')}
          </Text>
        )}
      </Card>

      <Text variant="muted" style={{ textAlign: 'center' }}>
        {t('counselorScreen.hint')}
      </Text>
    </Screen>
  );
}
