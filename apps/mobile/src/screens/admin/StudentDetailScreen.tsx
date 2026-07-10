import { View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  useCounselors,
  useCountries,
  useCreateEntity,
  useCurrencies,
  useDeleteEntity,
  useEducationLevels,
  useFinancialPlans,
  useHighSchools,
  useStudent,
  useUpdateStudent,
  type StudentUpdate,
} from '@wrsi/api';
import {
  emptyPhone,
  numericField,
  parsePhone,
  phoneFieldOptional,
  requiredString,
} from '@wrsi/shared-utils';
import { getMonthNames } from '@wrsi/i18n';
import { useTheme } from '@wrsi/ui';
import type { StudentsStackParamList } from '../../navigation/types';
import {
  FormDateField,
  FormInput,
  FormPhoneField,
  FormSearchSelect,
  FormSelect,
} from '../../components/form';
import { EntityDetailScreen } from './EntityDetailScreen';

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((v) => ({ label: v, value: v }));
const INTAKE = [
  { label: 'Fall', value: 'fall' as const },
  { label: 'Winter', value: 'winter' as const },
  { label: 'Spring / Summer', value: 'spring_summer' as const },
];

const schema = z.object({
  first_name: requiredString(),
  last_name: requiredString(),
  birth_date: z.string(),
  phone: phoneFieldOptional(),
  parent_or_guardian_name: z.string(),
  country_id: z.string().nullable(),
  counselor_id: z.string().nullable(),
  high_school_id: z.string().nullable(),
  highest_education_level_id: z.string().nullable(),
  financial_plan_id: z.string().nullable(),
  budget_currency_id: z.string().nullable(),
  average_grade: numericField({ min: 0, max: 100 }, 'validation.gradeRange'),
  cefr_level: z.string().nullable(),
  budget: numericField({ min: 0 }, 'validation.amountInvalid'),
  desired_intake_term: z.enum(['fall', 'winter', 'spring_summer']).nullable(),
  desired_intake_year: z.number().nullable(),
  expected_graduation_year: z.number().nullable(),
});
// `type` (not `interface`) so it satisfies `Form extends Record<string, unknown>`.
type FormState = z.infer<typeof schema>;

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  birth_date: '',
  phone: emptyPhone(),
  parent_or_guardian_name: '',
  country_id: null,
  counselor_id: null,
  high_school_id: null,
  highest_education_level_id: null,
  financial_plan_id: null,
  budget_currency_id: null,
  average_grade: '',
  cefr_level: null,
  budget: '',
  desired_intake_term: null,
  desired_intake_year: null,
  expected_graduation_year: null,
};

export function StudentDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { studentId } = useRoute<RouteProp<StudentsStackParamList, 'StudentDetail'>>().params;
  const mode = studentId ? 'edit' : 'create';

  const student = useStudent(studentId);
  const create = useCreateEntity('student');
  const update = useUpdateStudent(studentId ?? '');
  const remove = useDeleteEntity('student');
  const countries = useCountries();
  const counselors = useCounselors();
  const highSchools = useHighSchools();
  const levels = useEducationLevels();
  const plans = useFinancialPlans();
  const currencies = useCurrencies();

  const optionsReady = Boolean(
    countries.data &&
      counselors.data &&
      highSchools.data &&
      levels.data &&
      plans.data &&
      currencies.data,
  );

  const isoToId = (iso: string) =>
    countries.data?.find((c) => c.iso_code === iso)?.id ?? null;

  const initialForm: FormState | undefined = student.data
    ? {
        first_name: student.data.first_name,
        last_name: student.data.last_name,
        birth_date: student.data.birth_date ?? '',
        phone: parsePhone(student.data.phone_number, isoToId),
        parent_or_guardian_name: student.data.parent_or_guardian_name ?? '',
        country_id: student.data.country_id,
        counselor_id: student.data.counselor_id,
        high_school_id: student.data.high_school_id,
        highest_education_level_id: student.data.highest_education_level_id,
        financial_plan_id: student.data.financial_plan_id,
        budget_currency_id: student.data.budget_currency_id,
        average_grade:
          student.data.average_grade != null ? String(student.data.average_grade) : '',
        cefr_level: student.data.cefr_level,
        budget: student.data.budget != null ? String(student.data.budget) : '',
        desired_intake_term: student.data.desired_intake_term,
        desired_intake_year: student.data.desired_intake_year,
        expected_graduation_year: student.data.expected_graduation_year,
      }
    : undefined;

  const isEs = i18n.language.startsWith('es');
  const nowY = new Date().getFullYear();
  const countryOptions = (countries.data ?? []).map((c) => ({
    label: (isEs ? c.name_es : null) ?? c.name,
    value: c.id,
  }));
  const counselorOptions = (counselors.data ?? []).map((c) => ({
    label: `${c.first_name} ${c.last_name}`,
    value: c.id,
  }));
  const hsOptions = (highSchools.data ?? []).map((h) => ({ label: h.name, value: h.id }));
  const levelOptions = (levels.data ?? []).map((l) => ({ label: l.name, value: l.id }));
  const planOptions = (plans.data ?? []).map((p) => ({ label: p.name, value: p.id }));
  const currencyOptions = (currencies.data ?? []).map((c) => ({ label: c.code, value: c.id }));
  const gradYears = Array.from({ length: 8 }, (_, i) => nowY - 3 + i).map((y) => ({
    label: String(y),
    value: y,
  }));
  const intakeYears = Array.from({ length: 7 }, (_, i) => nowY + i).map((y) => ({
    label: String(y),
    value: y,
  }));

  function toPayload(form: FormState): StudentUpdate {
    return {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      birth_date: form.birth_date || null,
      phone_number: form.phone.e164,
      parent_or_guardian_name: form.parent_or_guardian_name.trim() || null,
      country_id: form.country_id,
      counselor_id: form.counselor_id,
      high_school_id: form.high_school_id,
      highest_education_level_id: form.highest_education_level_id,
      financial_plan_id: form.financial_plan_id,
      budget_currency_id: form.budget_currency_id,
      average_grade: form.average_grade ? Number(form.average_grade) : null,
      cefr_level: form.cefr_level,
      budget: form.budget ? Number(form.budget) : null,
      desired_intake_term: form.desired_intake_term,
      desired_intake_year: form.desired_intake_year,
      expected_graduation_year: form.expected_graduation_year,
    };
  }

  function renderFields(control: Control<FormState>) {
    return (
      <>
        <FormInput control={control} name="first_name" label={t('onboarding.firstName')} />
        <FormInput control={control} name="last_name" label={t('onboarding.lastName')} />
        <FormDateField
          control={control}
          name="birth_date"
          label={t('onboarding.birthDate')}
          minYear={nowY - 100}
          maxYear={nowY - 10}
          monthLabels={getMonthNames(i18n.language)}
          dayPlaceholder={t('picker.day')}
          monthPlaceholder={t('picker.month')}
          yearPlaceholder={t('picker.year')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <FormPhoneField
          control={control}
          name="phone"
          label={t('onboarding.phone')}
          countries={countries.data ?? []}
          spanish={isEs}
          placeholder={t('onboarding.phone')}
          countryPickerTitle={t('onboarding.phoneCountry')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <FormInput
          control={control}
          name="parent_or_guardian_name"
          label={t('onboarding.guardianName')}
        />
        <FormSearchSelect
          control={control}
          name="country_id"
          label={t('onboarding.nationality')}
          options={countryOptions}
          placeholder={t('picker.select')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <FormSearchSelect
          control={control}
          name="counselor_id"
          label={t('admin.assignedCounselor')}
          options={counselorOptions}
          placeholder={t('admin.unassigned')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <FormSearchSelect
          control={control}
          name="high_school_id"
          label={t('admin.highSchool')}
          options={hsOptions}
          placeholder={t('admin.unassigned')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <FormSelect
          control={control}
          name="highest_education_level_id"
          label={t('onboarding.achievedLevel')}
          options={levelOptions}
        />
        <FormInput
          control={control}
          name="average_grade"
          label={t('onboarding.averageGrade')}
          keyboardType="numeric"
        />
        <FormSelect control={control} name="cefr_level" label={t('onboarding.englishLevel')} options={CEFR} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 2 }}>
            <FormInput
              control={control}
              name="budget"
              label={t('onboarding.budget')}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormSelect
              control={control}
              name="budget_currency_id"
              label={t('onboarding.currency')}
              options={currencyOptions}
            />
          </View>
        </View>
        <FormSelect
          control={control}
          name="financial_plan_id"
          label={t('onboarding.financialPlan')}
          options={planOptions}
        />
        <FormSelect
          control={control}
          name="desired_intake_term"
          label={t('onboarding.intakeTerm')}
          options={INTAKE}
        />
        <FormSelect
          control={control}
          name="desired_intake_year"
          label={t('onboarding.intakeYear')}
          options={intakeYears}
        />
        <FormSelect
          control={control}
          name="expected_graduation_year"
          label={t('onboarding.graduationYear')}
          options={gradYears}
        />
      </>
    );
  }

  return (
    <EntityDetailScreen
      mode={mode}
      title={mode === 'create' ? t('admin.addStudent') : t('admin.editStudent')}
      schema={schema}
      emptyForm={EMPTY_FORM}
      initialForm={initialForm}
      optionsReady={optionsReady}
      toPayload={toPayload}
      create={create}
      update={update}
      remove={remove}
      entityId={studentId}
      renderFields={renderFields}
    />
  );
}
