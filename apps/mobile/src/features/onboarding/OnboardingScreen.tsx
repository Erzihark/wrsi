import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
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
import { Button, Input, MultiSelect, Screen, Select, Text, useTheme } from '@wrsi/ui';
import {
  BUDGET_OPTIONS,
  CEFR_OPTIONS,
  INTAKE_TERM_OPTIONS,
  onboardingDefaults,
  onboardingSchema,
  type OnboardingForm,
} from './schema';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [step, setStep] = useState(0);

  const countries = useCountries();
  const fields = useFieldsOfStudy();
  const levels = useEducationLevels();
  const plans = useFinancialPlans();
  const currencies = useCurrencies();
  const complete = useCompleteOnboarding();

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: onboardingDefaults,
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

  const opt = <T extends { id: string; name: string }>(rows: T[]) =>
    rows.map((r) => ({ label: r.name, value: r.id }));
  const countryOptions = opt(countries.data);
  const fieldOptions = opt(fields.data);
  const levelOptions = opt(levels.data);
  const planOptions = opt(plans.data);
  const currencyOptions = currencies.data.map((c) => ({ label: c.code, value: c.id }));
  const yearOptions = intakeYearOptions().map((y) => ({ label: String(y), value: y }));
  const gy = new Date().getFullYear();
  const gradYearOptions = Array.from({ length: 8 }, (_, i) => gy - 3 + i).map((y) => ({
    label: String(y),
    value: y,
  }));

  const submit = form.handleSubmit(async (values) => {
    const p_profile = {
      first_name: values.first_name,
      last_name: values.last_name,
      birth_date: values.birth_date || null,
      phone_number: values.phone_number || null,
      parent_or_guardian_name: values.parent_or_guardian_name || null,
      country_id: values.country_id,
      highest_education_level_id: values.highest_education_level_id,
      average_grade: values.average_grade || null,
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
  });

  async function next() {
    if (step === 0) {
      const ok = await form.trigger(['first_name', 'last_name', 'birth_date']);
      if (!ok) return;
    }
    setStep((s) => Math.min(2, s + 1));
  }

  return (
    <Screen scroll>
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
                error={fieldState.error?.message}
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
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="birth_date"
            render={({ field, fieldState }) => (
              <Input
                label={t('onboarding.birthDate')}
                autoCapitalize="none"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <Input
                label={t('onboarding.phone')}
                keyboardType="phone-pad"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="parent_or_guardian_name"
            render={({ field }) => (
              <Input
                label={t('onboarding.guardianName')}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="country_id"
            render={({ field }) => (
              <Select
                label={t('onboarding.nationality')}
                options={countryOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="passport_country_ids"
            render={({ field }) => (
              <MultiSelect
                label={t('onboarding.passports')}
                options={countryOptions}
                values={field.value}
                onChange={field.onChange}
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
            render={({ field }) => (
              <MultiSelect
                label={t('onboarding.intendedLevel')}
                options={levelOptions}
                values={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="field_ids"
            render={({ field }) => (
              <MultiSelect
                label={t('onboarding.fieldsInterest')}
                options={fieldOptions}
                values={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="country_interest_ids"
            render={({ field }) => (
              <MultiSelect
                label={t('onboarding.countriesInterest')}
                options={countryOptions}
                values={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="desired_intake_term"
            render={({ field }) => (
              <Select
                label={t('onboarding.intakeTerm')}
                options={INTAKE_TERM_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="desired_intake_year"
            render={({ field }) => (
              <Select
                label={t('onboarding.intakeYear')}
                options={yearOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="expected_graduation_year"
            render={({ field }) => (
              <Select
                label={t('onboarding.graduationYear')}
                options={gradYearOptions}
                value={field.value}
                onChange={field.onChange}
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
            render={({ field }) => (
              <Select
                label={t('onboarding.achievedLevel')}
                options={levelOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="average_grade"
            render={({ field }) => (
              <Input
                label={t('onboarding.averageGrade')}
                keyboardType="numeric"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="cefr_level"
            render={({ field }) => (
              <Select
                label={t('onboarding.englishLevel')}
                options={CEFR_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="budget"
            render={({ field }) => (
              <Select
                label={t('onboarding.budget')}
                options={BUDGET_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="budget_currency_id"
            render={({ field }) => (
              <Select
                label={t('onboarding.currency')}
                options={currencyOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="financial_plan_id"
            render={({ field }) => (
              <Select
                label={t('onboarding.financialPlan')}
                options={planOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        {step > 0 && (
          <View style={{ flex: 1 }}>
            <Button variant="secondary" title={t('common.back')} onPress={() => setStep((s) => s - 1)} />
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
