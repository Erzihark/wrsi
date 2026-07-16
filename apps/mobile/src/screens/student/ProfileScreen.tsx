import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMyStudentProfile } from '@wrsi/api';
import { computeProfileCompletion, fullName } from '@wrsi/shared-utils';
import { Avatar, Button, Card, ProgressRing, Screen, Text, useTheme } from '@wrsi/ui';
import { useAuth } from '../../auth/AuthContext';

/**
 * "Mi perfil" — the interim profile screen.
 *
 * This is deliberately minimal: the designed profile page ("Mi información":
 * grouped personal/academic rows with Completado/Pendiente state, photo upload,
 * per-field editing) lands in the next PR along with the schema it needs
 * (guardian phone, consent, English test score, personal notes, references).
 *
 * It ships now because it owns **Log out**: students no longer see the staff
 * `AppHeader`, which was the app's only sign-out affordance.
 */
export function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { signOut } = useAuth();
  const { data: student } = useMyStudentProfile();

  const name = student ? fullName(student.first_name, student.last_name) : '';
  const completion = computeProfileCompletion(student);

  return (
    <Screen scroll testID="student-profile-screen">
      {/* Title comes from the tab header. */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
        <Avatar photoUrl={student?.photo_url} name={name} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title">{name}</Text>
          <Text variant="muted">{t('profile.role')}</Text>
        </View>
        <ProgressRing value={completion.percent / 100} size={56} strokeWidth={5}>
          <Text style={{ fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold }}>
            {completion.percent}%
          </Text>
        </ProgressRing>
      </Card>

      <Card>
        <Text variant="label">{t('profile.completionTitle')}</Text>
        <Text variant="muted">
          {t('profile.completionDetail', {
            completed: completion.completed,
            total: completion.total,
          })}
        </Text>
      </Card>

      <Button
        testID="student-logout"
        variant="secondary"
        title={t('auth.logout')}
        onPress={() => void signOut()}
      />
    </Screen>
  );
}
