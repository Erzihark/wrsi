import { Linking, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useMyCounselor } from '@wrsi/api';
import { computeProfileCompletion, waChatUrl, type ProfileCompletionInput } from '@wrsi/shared-utils';
import {
  Avatar,
  Card,
  CameraIcon,
  Carousel,
  ChevronRightIcon,
  ProgressRing,
  Text,
  WhatsAppIcon,
  useTheme,
} from '@wrsi/ui';
import type { StudentHomeStackParamList, StudentTabParamList } from '../../../navigation/types';

/**
 * The paged highlights row: "Completa tu perfil" (completion ring + photo) and
 * "Tu consejera WRSI" (photo + WhatsApp CTA). The counselor page is omitted
 * entirely when the student has no counselor assigned yet.
 */
export function HighlightsCarousel({
  student,
}: {
  student: (ProfileCompletionInput & { first_name: string; last_name: string }) | null | undefined;
}) {
  const counselor = useMyCounselor();

  return (
    <Carousel>
      <ProfileCompletionCard student={student} />
      {counselor.data ? <CounselorCard counselor={counselor.data} /> : null}
    </Carousel>
  );
}

function ProfileCompletionCard({
  student,
}: {
  student: (ProfileCompletionInput & { first_name: string; last_name: string }) | null | undefined;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentHomeStackParamList>>();
  const completion = computeProfileCompletion(student);

  return (
    <Pressable
      testID="student-profile-card"
      accessibilityRole="button"
      onPress={() =>
        nav
          .getParent<BottomTabNavigationProp<StudentTabParamList>>()
          ?.navigate('Profile', { screen: 'ProfileHome' })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Avatar
          photoUrl={student?.photo_url}
          name={student ? `${student.first_name} ${student.last_name}` : null}
          size={52}
          badge={
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.color.text,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: theme.color.surface,
              }}
            >
              <CameraIcon size={11} color={theme.color.primaryText} />
            </View>
          }
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label">{t('home.profileCard.title')}</Text>
          <Text variant="muted" style={{ color: theme.color.primaryDark }}>
            {t('home.profileCard.completed', {
              completed: completion.completed,
              total: completion.total,
            })}
          </Text>
        </View>
        <ProgressRing value={completion.percent / 100} size={52} strokeWidth={5}>
          <Text style={{ fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold }}>
            {completion.percent}%
          </Text>
        </ProgressRing>
        <ChevronRightIcon size={18} color={theme.color.textMuted} />
      </Card>
    </Pressable>
  );
}

interface CounselorSummary {
  first_name: string;
  last_name: string;
  phone: string | null;
  photo_url: string | null;
}

function CounselorCard({ counselor }: { counselor: CounselorSummary }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<StudentHomeStackParamList>>();
  // Free-text phone: only offer the CTA when it parses to a valid number.
  const chatUrl = waChatUrl(counselor.phone);

  return (
    <Pressable
      testID="student-counselor-card"
      accessibilityRole="button"
      onPress={() =>
        nav.getParent<BottomTabNavigationProp<StudentTabParamList>>()?.navigate('Counselor')
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <Avatar
            photoUrl={counselor.photo_url}
            name={`${counselor.first_name} ${counselor.last_name}`}
            size={52}
            badge={
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.success,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: theme.color.surface,
                }}
              >
                <WhatsAppIcon size={12} color={theme.color.primaryText} />
              </View>
            }
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label">{t('home.counselorCard.title')}</Text>
            <Text style={{ fontWeight: theme.fontWeight.semibold }}>{counselor.first_name}</Text>
            {chatUrl ? (
              <Text variant="muted" style={{ color: theme.color.success }}>
                {t('home.counselorCard.online')}
              </Text>
            ) : null}
          </View>
          <ChevronRightIcon size={18} color={theme.color.textMuted} />
        </View>

        {chatUrl ? (
          <Pressable
            testID="student-counselor-chat"
            accessibilityRole="button"
            onPress={() => void Linking.openURL(chatUrl)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.xs,
              backgroundColor: theme.color.primarySoft,
              borderRadius: theme.radius.md,
              paddingVertical: theme.spacing.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <WhatsAppIcon size={16} color={theme.color.primaryDark} />
            <Text style={{ color: theme.color.primaryDark, fontWeight: theme.fontWeight.semibold }}>
              {t('home.counselorCard.openChat')}
            </Text>
          </Pressable>
        ) : null}
      </Card>
    </Pressable>
  );
}
