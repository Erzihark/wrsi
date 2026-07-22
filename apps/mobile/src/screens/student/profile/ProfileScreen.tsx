import { ActivityIndicator, Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import {
  useCountries,
  useEducationLevels,
  useFieldsOfStudy,
  useHighSchools,
  useMyLanguageExams,
  useMyProfileCompletion,
  useMyReferences,
  useMyStudentInterestSelections,
  useMyStudentProfile,
  useUploadMyAvatar,
} from "@wrsi/api";
import { fullName, intakeTermLabel } from "@wrsi/shared-utils";
import {
  Avatar,
  Badge,
  BookIcon,
  Button,
  CalendarIcon,
  CameraIcon,
  Card,
  ChatIcon,
  EditIcon,
  GraduationCapIcon,
  MailIcon,
  MapPinIcon,
  PersonIcon,
  ProgressRing,
  Screen,
  ShieldIcon,
  TargetIcon,
  Text,
  UsersIcon,
  WhatsAppIcon,
  useTheme,
  useToast,
} from "@wrsi/ui";
import { useAuth } from "../../../auth/AuthContext";
import type { ProfileFieldKey } from "../../../features/profile/fields";
import { pickAvatarFile } from "../../../features/profile/pickAvatar";
import type { StudentProfileStackParamList } from "../../../navigation/types";
import { ProfileRow, ProfileSection } from "./ProfileRow";

type Nav = NativeStackNavigationProp<
  StudentProfileStackParamList,
  "ProfileHome"
>;

/**
 * "Mi información" — the designed profile screen.
 *
 * Read-only by design: every row deep-links into the single edit form, focused
 * on the field that was tapped. Two rows have no edit affordance — the email is
 * the auth identity, and the high school is staff-owned (the
 * `students_guard_restricted_columns` trigger rejects a student changing it).
 */
export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const nav = useNavigation<Nav>();
  const { session, signOut } = useAuth();

  const { data: student, isLoading } = useMyStudentProfile();
  const completion = useMyProfileCompletion();
  const interests = useMyStudentInterestSelections(student?.id);
  const exams = useMyLanguageExams();
  const references = useMyReferences();
  const uploadAvatar = useUploadMyAvatar();

  const countries = useCountries();
  const levels = useEducationLevels();
  const fields = useFieldsOfStudy();
  const highSchools = useHighSchools();

  if (isLoading || !student) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const isEs = i18n.language.startsWith("es");
  const name = fullName(student.first_name, student.last_name);

  const nameOf = (
    rows: { id: string; name: string }[] | undefined,
    id: string | null,
  ) => (id ? ((rows ?? []).find((r) => r.id === id)?.name ?? null) : null);

  const namesOf = (
    rows: { id: string; name: string }[] | undefined,
    ids: string[] | undefined,
  ) =>
    (ids ?? [])
      .map((id) => (rows ?? []).find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const countryName = (id: string | null) => {
    const row = id ? countries.data?.find((c) => c.id === id) : null;
    if (!row) return null;
    return (isEs ? row.name_es : null) ?? row.name;
  };

  // "Mexicana · Estadounidense" — primary nationality plus any extra passports.
  const nationality = [
    countryName(student.country_id),
    ...(interests.data?.passportCountryIds ?? [])
      .filter((id) => id !== student.country_id)
      .map(countryName),
  ]
    .filter(Boolean)
    .join(" · ");

  // "Avanzado (C1) – IELTS 7.0"
  const examRow = exams.data?.[0];
  const englishValue = [
    student.cefr_level,
    examRow
      ? `${examRow.language_exams?.name ?? ""} ${examRow.score ?? ""}`.trim()
      : null,
  ]
    .filter(Boolean)
    .join(" – ");

  const intake =
    student.desired_intake_term && student.desired_intake_year
      ? `${intakeTermLabel(student.desired_intake_term)} ${student.desired_intake_year}`
      : null;

  const guardian = [
    student.parent_or_guardian_name,
    student.parent_or_guardian_phone
      ? `(${student.parent_or_guardian_phone})`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  function edit(focus?: ProfileFieldKey) {
    nav.navigate("ProfileEdit", { focus });
  }

  async function changePhoto() {
    try {
      const file = await pickAvatarFile();
      if (!file) return; // cancelled or permission declined
      await uploadAvatar.mutateAsync({ userId: session!.user.id, file });
      toast.show({ type: "success", message: t("profile.photoUpdated") });
    } catch (e) {
      toast.show({ type: "error", message: (e as Error).message });
    }
  }

  return (
    <Screen scroll testID="student-profile-screen">
      {/* --- Identity card --- */}
      <Card
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.lg,
        }}
      >
        <Pressable
          testID="student-profile-photo"
          accessibilityRole="button"
          accessibilityLabel={t("profile.changePhoto")}
          onPress={() => void changePhoto()}
          disabled={uploadAvatar.isPending}
        >
          <Avatar
            photoUrl={student.photo_url}
            name={name}
            size={72}
            badge={
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.brand,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: theme.color.surface,
                }}
              >
                {uploadAvatar.isPending ? (
                  <ActivityIndicator size="small" color={theme.color.brandText} />
                ) : (
                  <CameraIcon size={13} color={theme.color.brandText} />
                )}
              </View>
            }
          />
        </Pressable>

        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="title">{name}</Text>
          <Text variant="muted">{t("profile.role")}</Text>
          <Badge label={t("profile.active")} tone="success" />
        </View>

        <View style={{ alignItems: "center", gap: 2 }}>
          <ProgressRing
            value={completion.percent / 100}
            size={56}
            strokeWidth={5}
          >
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.fontWeight.bold,
              }}
            >
              {completion.percent}%
            </Text>
          </ProgressRing>
          <Text variant="muted" style={{ fontSize: 10, textAlign: "center" }}>
            {t("profile.completionDetail", {
              completed: completion.completed,
              total: completion.total,
            })}
          </Text>
        </View>
      </Card>

      {/* --- Nudge banner, only while something's outstanding --- */}
      {completion.percent < 100 ? (
        <Card
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            backgroundColor: theme.color.primarySoft,
            borderColor: theme.color.primarySoft,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label">{t("profile.nudgeTitle")}</Text>
            <Text variant="muted" style={{ fontSize: theme.fontSize.xs }}>
              {t("profile.nudgeBody")}
            </Text>
          </View>
          <Button
            testID="student-profile-complete"
            title={t("profile.nudgeCta")}
            onPress={() => edit()}
          />
        </Card>
      ) : null}

      {/* --- Información personal --- */}
      <ProfileSection title={t("profile.sections.personal")}>
        <ProfileRow
          testID="student-profile-row-name"
          icon={(c) => <PersonIcon size={20} color={c} />}
          label={t("profile.fields.name")}
          value={name}
          complete={Boolean(student.first_name && student.last_name)}
          onPress={() => edit("name")}
        />
        <ProfileRow
          testID="student-profile-row-phone"
          icon={(c) => <WhatsAppIcon size={20} color={c} />}
          label={t("profile.fields.whatsapp")}
          value={student.phone_number}
          complete={Boolean(student.phone_number)}
          onPress={() => edit("phone")}
        />
        {/* The auth identity — changing it is a guarded operation, not a profile edit. */}
        <ProfileRow
          icon={(c) => <MailIcon size={20} color={c} />}
          label={t("profile.fields.email")}
          value={session?.user.email ?? null}
          complete={Boolean(session?.user.email)}
        />
        <ProfileRow
          testID="student-profile-row-guardian"
          icon={(c) => <UsersIcon size={20} color={c} />}
          label={t("profile.fields.guardian")}
          value={guardian}
          complete={Boolean(
            student.parent_or_guardian_name && student.parent_or_guardian_phone,
          )}
          onPress={() => edit("guardian")}
        />
        <ProfileRow
          testID="student-profile-row-consent"
          icon={(c) => <ShieldIcon size={20} color={c} />}
          label={t("profile.fields.consent")}
          value={t(
            student.consent_info_use
              ? "profile.consentGranted"
              : "profile.consentMissing",
          )}
          complete={student.consent_info_use}
          onPress={() => edit("consent")}
        />
      </ProfileSection>

      {/* --- Información académica --- */}
      <ProfileSection title={t("profile.sections.academic")}>
        {/* Staff-owned: the guard trigger rejects a student changing their school. */}
        <ProfileRow
          icon={(c) => <GraduationCapIcon size={20} color={c} />}
          label={t("profile.fields.highSchool")}
          value={nameOf(highSchools.data, student.high_school_id)}
          complete={Boolean(student.high_school_id)}
        />
        <ProfileRow
          testID="student-profile-row-intake"
          icon={(c) => <CalendarIcon size={20} color={c} />}
          label={t("profile.fields.intake")}
          value={intake}
          complete={Boolean(intake)}
          onPress={() => edit("intake")}
        />
        <ProfileRow
          testID="student-profile-row-birth"
          icon={(c) => <CalendarIcon size={20} color={c} />}
          label={t("profile.fields.birthDate")}
          value={student.birth_date}
          complete={Boolean(student.birth_date)}
          onPress={() => edit("birth_date")}
        />
        <ProfileRow
          testID="student-profile-row-study-level"
          icon={(c) => <BookIcon size={20} color={c} />}
          label={t("profile.fields.studyType")}
          value={namesOf(levels.data, interests.data?.intendedLevelIds)}
          complete={(interests.data?.intendedLevelIds.length ?? 0) > 0}
          onPress={() => edit("study_level")}
        />
        <ProfileRow
          testID="student-profile-row-nationality"
          icon={(c) => <MapPinIcon size={20} color={c} />}
          label={t("profile.fields.nationality")}
          value={nationality}
          complete={Boolean(student.country_id)}
          onPress={() => edit("nationality")}
        />
        <ProfileRow
          testID="student-profile-row-english"
          icon={(c) => <ChatIcon size={20} color={c} />}
          label={t("profile.fields.english")}
          value={englishValue}
          complete={Boolean(student.cefr_level && examRow)}
          onPress={() => edit("english")}
        />
        <ProfileRow
          testID="student-profile-row-field"
          icon={(c) => <TargetIcon size={20} color={c} />}
          label={t("profile.fields.fieldOfStudy")}
          value={namesOf(fields.data, interests.data?.fieldIds)}
          complete={(interests.data?.fieldIds.length ?? 0) > 0}
          onPress={() => edit("field_of_study")}
        />
        <ProfileRow
          testID="student-profile-row-notes"
          icon={(c) => <BookIcon size={20} color={c} />}
          label={t("profile.fields.notes")}
          value={student.personal_notes}
          complete={Boolean(student.personal_notes)}
          onPress={() => edit("notes")}
        />
        <ProfileRow
          testID="student-profile-row-references"
          icon={(c) => <UsersIcon size={20} color={c} />}
          label={t("profile.fields.references")}
          value={
            references.data && references.data.length > 0
              ? references.data.map((r) => r.full_name).join(", ")
              : null
          }
          complete={(references.data?.length ?? 0) > 0}
          onPress={() => edit("references")}
        />
      </ProfileSection>

      <Button
        testID="student-logout"
        variant="secondary"
        title={t("auth.logout")}
        onPress={() => void signOut()}
      />
    </Screen>
  );
}
