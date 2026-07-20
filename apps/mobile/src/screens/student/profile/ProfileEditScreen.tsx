import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  useCountries,
  useCurrencies,
  useEducationLevels,
  useFieldsOfStudy,
  useFinancialPlans,
  useLanguageExams,
  useMyLanguageExams,
  useMyStudentInterestSelections,
  useMyStudentProfile,
  useSaveMyLanguageExam,
  useUpdateMyStudentProfile,
} from '@wrsi/api';
import { intakeYearOptions, parsePhone } from '@wrsi/shared-utils';
import { getMonthNames } from '@wrsi/i18n';
import {
  Button,
  DateField,
  Input,
  MultiSelect,
  Screen,
  SearchMultiSelect,
  SearchSelect,
  Select,
  Text,
  useTheme,
  useToast,
} from '@wrsi/ui';
import { FormPhoneField } from '../../../components/form';
import {
  BUDGET_OPTIONS,
  CEFR_OPTIONS,
  INTAKE_TERM_OPTIONS,
  onboardingDefaults,
} from '../../../features/onboarding/schema';
import {
  profileEditDefaults,
  profileEditSchema,
  type ProfileEditForm,
  type ProfileEditFormInput,
} from '../../../features/profile/schema';
import { isFocusable, type ProfileFieldKey } from '../../../features/profile/fields';
import type { StudentProfileStackParamList } from '../../../navigation/types';
import { ReferencesEditor } from './ReferencesEditor';

type Nav = NativeStackNavigationProp<StudentProfileStackParamList, 'ProfileEdit'>;

type Positions = Partial<Record<ProfileFieldKey, number>>;

/**
 * Records a field's Y offset within the scroll content so `focus` can jump to
 * it. Defined at module scope on purpose: a component declared inside the screen
 * would be a new type on every render, remounting every input (and dropping the
 * keyboard) on each keystroke.
 */
function Field({
  name,
  positions,
  children,
}: {
  name: ProfileFieldKey;
  positions: React.RefObject<Positions>;
  children: ReactNode;
}) {
  return (
    <View onLayout={(e) => (positions.current[name] = e.nativeEvent.layout.y)}>{children}</View>
  );
}

/**
 * The single profile edit form.
 *
 * Deliberately bare-bones — there's no design for it yet, so this is one plain
 * scrolling form rather than a styled layout. Both entry points land here: the
 * "Editar" button opens it at the top, and tapping a row on the profile screen
 * opens it scrolled to that field (and focused, when the field is a text input).
 *
 * References save immediately (their own table); everything else saves on submit
 * through the `update_student_profile` RPC, which still requires the full
 * onboarding field set — hence the whole set is rendered here.
 */
export function ProfileEditScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<StudentProfileStackParamList, 'ProfileEdit'>>();
  const focus = route.params?.focus;

  const { data: student } = useMyStudentProfile();
  const interests = useMyStudentInterestSelections(student?.id);
  const exams = useMyLanguageExams();
  const update = useUpdateMyStudentProfile();
  const saveExam = useSaveMyLanguageExam();

  const countries = useCountries();
  const levels = useEducationLevels();
  const fields = useFieldsOfStudy();
  const plans = useFinancialPlans();
  const currencies = useCurrencies();
  const languageExams = useLanguageExams();

  const scrollRef = useRef<ScrollView>(null);
  // Y offset of each field within the scroll content, captured on layout.
  const positions = useRef<Positions>({});
  const inputs = useRef<Partial<Record<ProfileFieldKey, TextInput | null>>>({});
  const [prefilled, setPrefilled] = useState(false);

  const form = useForm<ProfileEditFormInput, unknown, ProfileEditForm>({
    resolver: zodResolver(profileEditSchema) as Resolver<
      ProfileEditFormInput,
      unknown,
      ProfileEditForm
    >,
    defaultValues: profileEditDefaults(onboardingDefaults),
    mode: 'onTouched',
  });

  const ready =
    student && interests.data && countries.data && levels.data && fields.data &&
    plans.data && currencies.data && languageExams.data && exams.data;

  // Prefill once everything the form needs has arrived (reset() would clobber
  // in-progress edits if it ran on every refetch).
  useEffect(() => {
    if (!ready || prefilled || !student) return;
    const exam = exams.data?.[0];
    // parsePhone maps the detected ISO country back to our country_id.
    const isoToId = (iso: string) =>
      countries.data?.find((c) => c.iso_code === iso)?.id ?? null;

    form.reset({
      first_name: student.first_name ?? '',
      last_name: student.last_name ?? '',
      birth_date: student.birth_date ?? '',
      phone: parsePhone(student.phone_number, isoToId),
      parent_or_guardian_name: student.parent_or_guardian_name ?? '',
      country_id: student.country_id,
      passport_country_ids: interests.data?.passportCountryIds ?? [],
      country_interest_ids: interests.data?.countryInterestIds ?? [],
      field_ids: interests.data?.fieldIds ?? [],
      intended_level_ids: interests.data?.intendedLevelIds ?? [],
      highest_education_level_id: student.highest_education_level_id,
      average_grade: student.average_grade != null ? String(student.average_grade) : '',
      cefr_level: student.cefr_level,
      budget: student.budget != null ? String(student.budget) : null,
      budget_currency_id: student.budget_currency_id,
      financial_plan_id: student.financial_plan_id,
      desired_intake_term: student.desired_intake_term,
      desired_intake_year: student.desired_intake_year,
      expected_graduation_year: student.expected_graduation_year,
      guardian_phone: parsePhone(student.parent_or_guardian_phone, isoToId),
      consent_info_use: student.consent_info_use,
      personal_notes: student.personal_notes ?? '',
      english_exam_id: exam?.language_exam_id ?? null,
      english_exam_score: exam?.score != null ? String(exam.score) : '',
    });
    setPrefilled(true);
  }, [ready, prefilled, student, interests.data, countries.data, exams.data, form]);

  // Once prefilled, jump to the field the student tapped on their profile.
  useEffect(() => {
    if (!prefilled || !focus) return;
    // `onLayout` fires asynchronously after commit, so `positions` is still
    // empty during this effect's synchronous run — measure on a delay instead,
    // or the scroll silently no-ops.
    const id = setTimeout(() => {
      const y = positions.current[focus];
      if (y != null) {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      }
      // Opening the keyboard last keeps it from covering the target mid-scroll.
      if (isFocusable(focus)) inputs.current[focus]?.focus();
    }, 300);
    return () => clearTimeout(id);
  }, [prefilled, focus]);

  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  // Validation messages are always one of our own `validation.*` keys (see
  // features/profile/schema.ts), but react-hook-form's FieldError.message
  // widens that to `string` — the cast below opts this call out of the
  // strict-key typing intentionally, since the key isn't a literal here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
  const errText = (message?: string) => (message ? (t(message as any) as string) : undefined);
  const picker = {
    placeholder: t('picker.select'),
    searchPlaceholder: t('picker.search'),
    noResultsText: t('picker.noResults'),
  };
  const isEs = i18n.language.startsWith('es');
  const opt = <T extends { id: string; name: string }>(rows: T[]) =>
    rows.map((r) => ({ label: r.name, value: r.id }));
  const countryOptions = (countries.data ?? []).map((c) => ({
    label: (isEs ? c.name_es : null) ?? c.name,
    value: c.id,
  }));
  const nowYear = new Date().getFullYear();

  const submit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        p_profile: {
          first_name: values.first_name,
          last_name: values.last_name,
          birth_date: values.birth_date,
          phone_number: values.phone.e164 ?? '',
          parent_or_guardian_name: values.parent_or_guardian_name,
          parent_or_guardian_phone: values.guardian_phone.e164 ?? '',
          country_id: values.country_id,
          highest_education_level_id: values.highest_education_level_id,
          average_grade: values.average_grade,
          cefr_level: values.cefr_level,
          budget: values.budget,
          budget_currency_id: values.budget_currency_id,
          financial_plan_id: values.financial_plan_id,
          desired_intake_term: values.desired_intake_term,
          desired_intake_year: values.desired_intake_year,
          expected_graduation_year: values.expected_graduation_year,
          personal_notes: values.personal_notes,
          consent_info_use: values.consent_info_use,
        },
        p_passport_country_ids: values.passport_country_ids,
        p_country_interest_ids: values.country_interest_ids,
        p_field_ids: values.field_ids,
        p_intended_level_ids: values.intended_level_ids,
      });

      // The exam lives in its own table; only touch it when one was chosen.
      if (values.english_exam_id && student) {
        await saveExam.mutateAsync({
          studentId: student.id,
          languageExamId: values.english_exam_id,
          score: values.english_exam_score ? Number(values.english_exam_score) : null,
        });
      }

      toast.show({ type: 'success', message: t('profile.saved') });
      nav.goBack();
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  });

  return (
    <ScrollView
      ref={scrollRef}
      testID="student-profile-edit-screen"
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
    >
      <Text variant="muted">{t('profile.editHint')}</Text>

      <Field name="name" positions={positions}>
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="first_name"
            render={({ field, fieldState }) => (
              <Input
                ref={(r) => {
                  inputs.current.name = r;
                }}
                testID="profile-edit-first-name"
                label={t('onboarding.firstName')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="last_name"
            render={({ field, fieldState }) => (
              <Input
                label={t('onboarding.lastName')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
        </View>
      </Field>

      <Field name="phone" positions={positions}>
        <FormPhoneField
          control={form.control}
          name="phone"
          label={t('onboarding.phone')}
          countries={countries.data}
          spanish={isEs}
          placeholder={t('onboarding.phone')}
          countryPickerTitle={t('onboarding.phoneCountry')}
          searchPlaceholder={picker.searchPlaceholder}
          noResultsText={picker.noResultsText}
        />
      </Field>

      <Field name="guardian" positions={positions}>
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="parent_or_guardian_name"
            render={({ field, fieldState }) => (
              <Input
                ref={(r) => {
                  inputs.current.guardian = r;
                }}
                testID="profile-edit-guardian-name"
                label={t('onboarding.guardianName')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <FormPhoneField
            control={form.control}
            name="guardian_phone"
            label={t('profile.fields.guardianPhone')}
            countries={countries.data}
            spanish={isEs}
            placeholder={t('profile.fields.guardianPhone')}
            countryPickerTitle={t('onboarding.phoneCountry')}
            searchPlaceholder={picker.searchPlaceholder}
            noResultsText={picker.noResultsText}
          />
        </View>
      </Field>

      <Field name="consent" positions={positions}>
        <Controller
          control={form.control}
          name="consent_info_use"
          render={({ field }) => (
            <Select
              label={t('profile.fields.consent')}
              options={[
                { label: t('profile.consentGranted'), value: 'yes' },
                { label: t('profile.consentMissing'), value: 'no' },
              ]}
              value={field.value ? 'yes' : 'no'}
              onChange={(v) => field.onChange(v === 'yes')}
            />
          )}
        />
      </Field>

      <Field name="birth_date" positions={positions}>
        <Controller
          control={form.control}
          name="birth_date"
          render={({ field, fieldState }) => (
            <DateField
              label={t('onboarding.birthDate')}
              value={field.value}
              onChange={field.onChange}
              error={errText(fieldState.error?.message)}
              minYear={nowYear - 100}
              maxYear={nowYear - 10}
              monthLabels={getMonthNames(i18n.language)}
              dayPlaceholder={t('picker.day')}
              monthPlaceholder={t('picker.month')}
              yearPlaceholder={t('picker.year')}
              searchPlaceholder={picker.searchPlaceholder}
              noResultsText={picker.noResultsText}
            />
          )}
        />
      </Field>

      <Field name="nationality" positions={positions}>
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="country_id"
            render={({ field, fieldState }) => (
              <SearchSelect
                label={t('onboarding.nationality')}
                options={countryOptions}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
                {...picker}
              />
            )}
          />
          <Controller
            control={form.control}
            name="passport_country_ids"
            render={({ field, fieldState }) => (
              <SearchMultiSelect
                label={t('onboarding.passports')}
                options={countryOptions}
                values={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
                doneText={t('picker.done')}
                {...picker}
              />
            )}
          />
        </View>
      </Field>

      <Field name="study_level" positions={positions}>
        <Controller
          control={form.control}
          name="intended_level_ids"
          render={({ field, fieldState }) => (
            <MultiSelect
              label={t('onboarding.intendedLevel')}
              options={opt(levels.data ?? [])}
              values={field.value}
              onChange={field.onChange}
              error={errText(fieldState.error?.message)}
              {...picker}
            />
          )}
        />
      </Field>

      <Field name="field_of_study" positions={positions}>
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="field_ids"
            render={({ field, fieldState }) => (
              <SearchMultiSelect
                label={t('onboarding.fieldsInterest')}
                options={opt(fields.data ?? [])}
                values={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
                doneText={t('picker.done')}
                {...picker}
              />
            )}
          />
          <Controller
            control={form.control}
            name="country_interest_ids"
            render={({ field, fieldState }) => (
              <SearchMultiSelect
                label={t('onboarding.countriesInterest')}
                options={countryOptions}
                values={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
                doneText={t('picker.done')}
                {...picker}
              />
            )}
          />
        </View>
      </Field>

      <Field name="intake" positions={positions}>
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="desired_intake_term"
            render={({ field, fieldState }) => (
              <Select
                label={t('onboarding.intakeTerm')}
                options={INTAKE_TERM_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="desired_intake_year"
            render={({ field, fieldState }) => (
              <Select
                label={t('onboarding.intakeYear')}
                options={intakeYearOptions().map((y) => ({ label: String(y), value: y }))}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="expected_graduation_year"
            render={({ field, fieldState }) => (
              <Select
                label={t('onboarding.graduationYear')}
                options={Array.from({ length: 8 }, (_, i) => nowYear - 3 + i).map((y) => ({
                  label: String(y),
                  value: y,
                }))}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
        </View>
      </Field>

      <Field name="grade" positions={positions}>
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="highest_education_level_id"
            render={({ field, fieldState }) => (
              <Select
                label={t('onboarding.achievedLevel')}
                options={opt(levels.data ?? [])}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="average_grade"
            render={({ field, fieldState }) => (
              <Input
                ref={(r) => {
                  inputs.current.grade = r;
                }}
                label={t('onboarding.averageGrade')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="numeric"
                error={errText(fieldState.error?.message)}
              />
            )}
          />
        </View>
      </Field>

      <Field name="english" positions={positions}>
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="cefr_level"
            render={({ field, fieldState }) => (
              <Select
                label={t('onboarding.englishLevel')}
                options={CEFR_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="english_exam_id"
            render={({ field, fieldState }) => (
              <Select
                label={t('profile.fields.exam')}
                options={(languageExams.data ?? []).map((e) => ({ label: e.name, value: e.id }))}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="english_exam_score"
            render={({ field, fieldState }) => (
              <Input
                label={t('profile.fields.examScore')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="numeric"
                error={errText(fieldState.error?.message)}
              />
            )}
          />
        </View>
      </Field>

      {/* Budget / financial plan aren't on the designed profile view, but the RPC
          still requires them — so they're editable here rather than silently
          round-tripped. */}
      <View style={{ gap: theme.spacing.lg }}>
        <Controller
          control={form.control}
          name="budget"
          render={({ field, fieldState }) => (
            <Select
              label={t('onboarding.budget')}
              options={BUDGET_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errText(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={form.control}
          name="budget_currency_id"
          render={({ field, fieldState }) => (
            <Select
              label={t('onboarding.currency')}
              options={(currencies.data ?? []).map((c) => ({ label: c.code, value: c.id }))}
              value={field.value}
              onChange={field.onChange}
              error={errText(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={form.control}
          name="financial_plan_id"
          render={({ field, fieldState }) => (
            <Select
              label={t('onboarding.financialPlan')}
              options={opt(plans.data ?? [])}
              value={field.value}
              onChange={field.onChange}
              error={errText(fieldState.error?.message)}
            />
          )}
        />
      </View>

      <Field name="notes" positions={positions}>
        <Controller
          control={form.control}
          name="personal_notes"
          render={({ field, fieldState }) => (
            <Input
              ref={(r) => {
                  inputs.current.notes = r;
                }}
              testID="profile-edit-notes"
              label={t('profile.fields.notes')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              multiline
              numberOfLines={4}
              style={{ minHeight: 96, textAlignVertical: 'top' }}
              error={errText(fieldState.error?.message)}
            />
          )}
        />
      </Field>

      {/* Saves immediately — its own table, not part of the form submit. */}
      <Field name="references" positions={positions}>
        <ReferencesEditor
          studentId={student.id}
          countries={countries.data ?? []}
          spanish={isEs}
          countryPickerTitle={t('onboarding.phoneCountry')}
          searchPlaceholder={picker.searchPlaceholder}
          noResultsText={picker.noResultsText}
        />
      </Field>

      <Button
        testID="profile-edit-submit"
        title={t('common.save')}
        loading={update.isPending || saveExam.isPending}
        onPress={() => void submit()}
      />
    </ScrollView>
  );
}
