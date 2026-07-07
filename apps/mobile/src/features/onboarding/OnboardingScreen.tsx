import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, View } from 'react-native';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  useCompleteOnboarding,
  useCountries,
  useCurrencies,
  useEducationLevels,
  useFieldsOfStudy,
  useFinancialPlans,
} from '@wrsi/api';
import { intakeYearOptions } from '@wrsi/shared-utils';
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
} from '@wrsi/ui';
import { useAuth } from '../../auth/AuthContext';
import {
  BUDGET_OPTIONS,
  CEFR_OPTIONS,
  INTAKE_TERM_OPTIONS,
  STEP_FIELDS,
  onboardingDefaults,
  onboardingSchema,
  type OnboardingForm,
  type OnboardingFormInput,
} from './schema';

export function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { signOut } = useAuth();
  const [step, setStep] = useState(0);

  const countries = useCountries();
  const fields = useFieldsOfStudy();
  const levels = useEducationLevels();
  const plans = useFinancialPlans();
  const currencies = useCurrencies();
  const complete = useCompleteOnboarding();

  // There is no navigation stack behind onboarding (signing up drops the user
  // straight here), so the phone's back button has nothing to pop by default.
  // On the first step, offer to exit (sign out, back to Login); on later
  // steps, step backward through the wizard instead.
  function confirmExit() {
    Alert.alert(t('onboarding.exitConfirmTitle'), t('onboarding.exitConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('onboarding.exit'), style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      confirmExit();
    }
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true; // handled — prevent default (app close / no-op)
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const form = useForm<OnboardingFormInput, unknown, OnboardingForm>({
    resolver: zodResolver(onboardingSchema) as Resolver<
      OnboardingFormInput,
      unknown,
      OnboardingForm
    >,
    defaultValues: onboardingDefaults,
    mode: 'onTouched',
  });

  const ready =
    countries.data && fields.data && levels.data && plans.data && currencies.data;
  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  // Translate zod messages (they are i18n keys).
  const errText = (message?: string) => (message ? t(message) : undefined);
  const picker = {
    placeholder: t('picker.select'),
    searchPlaceholder: t('picker.search'),
    noResultsText: t('picker.noResults'),
  };

  const opt = <T extends { id: string; name: string }>(rows: T[]) =>
    rows.map((r) => ({ label: r.name, value: r.id }));
  const isEs = i18n.language.startsWith('es');
  // Country display names follow the app language (name_es vs English name).
  const countryOptions = countries.data.map((c) => ({
    label: (isEs ? c.name_es : null) ?? c.name,
    value: c.id,
  }));
  // Dial-code options: "México (+52)".
  const dialOptions = countries.data
    .filter((c) => c.calling_code)
    .map((c) => ({
      label: `${(isEs ? c.name_es : null) ?? c.name} (${c.calling_code})`,
      value: c.id,
    }));
  const fieldOptions = opt(fields.data);
  const levelOptions = opt(levels.data);
  const planOptions = opt(plans.data);
  const currencyOptions = currencies.data.map((c) => ({ label: c.code, value: c.id }));
  const yearOptions = intakeYearOptions().map((y) => ({ label: String(y), value: y }));
  const nowYear = new Date().getFullYear();
  const gradYearOptions = Array.from({ length: 8 }, (_, i) => nowYear - 3 + i).map((y) => ({
    label: String(y),
    value: y,
  }));

  const submit = form.handleSubmit(
    async (values) => {
      // Compose E.164-style phone: selected country's dial code + local digits.
      const dialCode =
        countries.data?.find((c) => c.id === values.phone_country_id)?.calling_code ?? '';
      const fullPhone = `${dialCode}${values.phone_number.replace(/[^0-9]/g, '')}`;
      const p_profile = {
        first_name: values.first_name,
        last_name: values.last_name,
        birth_date: values.birth_date,
        phone_number: fullPhone,
        parent_or_guardian_name: values.parent_or_guardian_name,
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
      };
      try {
        await complete.mutateAsync({
          p_profile,
          p_passport_country_ids: values.passport_country_ids,
          p_country_interest_ids: values.country_interest_ids,
          p_field_ids: values.field_ids,
          p_intended_level_ids: values.intended_level_ids,
        });
        // Success invalidates the student profile → the gate switches to the dashboard.
      } catch (e) {
        Alert.alert(t('common.error'), (e as Error).message);
      }
    },
    // If submit-time validation finds an earlier incomplete step, jump to it.
    (errors) => {
      const bad = STEP_FIELDS.findIndex((names) => names.some((n) => n in errors));
      if (bad >= 0) setStep(bad);
    },
  );

  async function next() {
    const stepFields = STEP_FIELDS[step];
    if (stepFields && !(await form.trigger(stepFields))) return;
    setStep((s) => Math.min(2, s + 1));
  }

  return (
    <Screen scroll>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          variant="ghost"
          title={step > 0 ? `‹ ${t('common.back')}` : t('onboarding.exit')}
          onPress={handleBack}
        />
      </View>
      <Text variant="heading">{t('onboarding.title')}</Text>
      <Text variant="muted">{t('onboarding.intro')}</Text>
      <Text variant="label">
        {step + 1} / 3 · {t(`onboarding.step${step + 1}` as 'onboarding.step1')}
      </Text>

      {step === 0 && (
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="first_name"
            render={({ field, fieldState }) => (
              <Input
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
          <Controller
            control={form.control}
            name="phone_country_id"
            render={({ field, fieldState }) => (
              <SearchSelect
                label={t('onboarding.phoneCountry')}
                options={dialOptions}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
                {...picker}
              />
            )}
          />
          <Controller
            control={form.control}
            name="phone_number"
            render={({ field, fieldState }) => (
              <Input
                label={t('onboarding.phone')}
                keyboardType="phone-pad"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="parent_or_guardian_name"
            render={({ field, fieldState }) => (
              <Input
                label={t('onboarding.guardianName')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
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
      )}

      {step === 1 && (
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="intended_level_ids"
            render={({ field, fieldState }) => (
              <MultiSelect
                label={t('onboarding.intendedLevel')}
                options={levelOptions}
                values={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="field_ids"
            render={({ field, fieldState }) => (
              <MultiSelect
                label={t('onboarding.fieldsInterest')}
                options={fieldOptions}
                values={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
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
                options={yearOptions}
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
                options={gradYearOptions}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
        </View>
      )}

      {step === 2 && (
        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={form.control}
            name="highest_education_level_id"
            render={({ field, fieldState }) => (
              <Select
                label={t('onboarding.achievedLevel')}
                options={levelOptions}
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
                label={t('onboarding.averageGrade')}
                keyboardType="numeric"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
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
                options={currencyOptions}
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
                options={planOptions}
                value={field.value}
                onChange={field.onChange}
                error={errText(fieldState.error?.message)}
              />
            )}
          />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        {step > 0 && (
          <View style={{ flex: 1 }}>
            <Button variant="secondary" title={t('common.back')} onPress={handleBack} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          {step < 2 ? (
            <Button title={t('common.next')} onPress={next} />
          ) : (
            <Button
              title={complete.isPending ? t('onboarding.submitting') : t('common.submit')}
              loading={complete.isPending}
              onPress={submit}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
