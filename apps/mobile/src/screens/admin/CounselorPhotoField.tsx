import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUploadCounselorPhoto } from '@wrsi/api';
import { Avatar, Button, CameraIcon, Text, useTheme, useToast } from '@wrsi/ui';
import { pickAvatarFile } from '../../features/profile/pickAvatar';

/**
 * Admin control for a counselor's photo — the image students see on the
 * dashboard counselor card and the Consejero tab. Counselors don't manage their
 * own profile yet, so this is where their photo comes from.
 *
 * Uploads into the counselor's own `{user_id}/…` avatars folder, which the
 * bucket policy allows for admins.
 */
export function CounselorPhotoField({
  counselorId,
  counselorUserId,
  photoUrl,
  name,
}: {
  counselorId: string;
  counselorUserId: string;
  photoUrl: string | null;
  name: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const upload = useUploadCounselorPhoto();

  async function change() {
    try {
      const file = await pickAvatarFile();
      if (!file) return; // cancelled or permission declined
      await upload.mutateAsync({ counselorId, counselorUserId, file });
      toast.show({ type: 'success', message: t('profile.photoUpdated') });
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="label">{t('admin.counselorPhoto')}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
        <Avatar photoUrl={photoUrl} name={name} size={64} />
        <Button
          testID="counselor-photo-upload"
          variant="secondary"
          title={t('profile.changePhoto')}
          icon={(c) => <CameraIcon size={16} color={c} />}
          loading={upload.isPending}
          onPress={() => void change()}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
