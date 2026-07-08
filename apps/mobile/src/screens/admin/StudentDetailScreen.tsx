import { View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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
import { getMonthNames } from '@wrsi/i18n';
import { DateField, Input, SearchSelect, Select, Text, useTheme } from '@wrsi/ui';
import type { StudentsStackParamList } from '../../navigation/types';
import { EntityDetailScreen, type SetField } from './EntityDetailScreen';

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((v) => ({ label: v, value: v }));
const INTAKE = [
  { label: 'Fall', value: 'fall' as const },
  { label: 'Winter', value: 'winter' as const },
  { label: 'Spring / Summer', value: 'spring_summer' as const },
];

// Editable subset of the students row (admin-managed record fields).
// A `type` (not `interface`) so it carries an implicit index signature and
// satisfies the EntityDetailScreen `Form extends Record<string, unknown>` bound.
type FormState = {
  first_name: string;
  last_name: string;
  birth_date: string;
  phone_number: string;
  parent_or_guardian_name: string;
  country_id: string | null;
  counselor_id: string | null;
  high_school_id: string | null;
  highest_education_level_id: string | null;
  financial_plan_id: string | null;
  budget_currency_id: string | null;
  average_grade: string;
  cefr_level: string | null;
  budget: string;
  desired_intake_term: 'fall' | 'winter' | 'spring_summer' | null;
  desired_intake_year: number | null;
  expected_graduation_year: number | null;
}

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  birth_date: '',
  phone_number: '',
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

  const initialForm: FormState | undefined = student.data
    ? {
        first_name: student.data.first_name,
        last_name: student.data.last_name,
        birth_date: student.data.birth_date ?? '',
        phone_number: student.data.phone_number ?? '',
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

  function validate(form: FormState): string | null {
    if (!form.first_name.trim() || !form.last_name.trim()) return t('validation.required');
    const grade = form.average_grade ? Number(form.average_grade) : null;
    if (grade != null && (grade < 0 || grade > 100)) return t('validation.gradeRange');
    return null;
  }

  function toPayload(form: FormState): StudentUpdate {
    return {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      birth_date: form.birth_date || null,
      phone_number: form.phone_number || null,
      parent_or_guardian_name: form.parent_or_guardian_name || null,
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

  function renderFields(form: FormState, set: SetField<FormState>) {
    return (
      <>
        <Input
          label={t('onboarding.firstName')}
          value={form.first_name}
          onChangeText={(v) => set('first_name', v)}
        />
        <Input
          label={t('onboarding.lastName')}
          value={form.last_name}
          onChangeText={(v) => set('last_name', v)}
        />
        <DateField
          label={t('onboarding.birthDate')}
          value={form.birth_date}
          onChange={(v) => set('birth_date', v)}
          minYear={nowY - 100}
          maxYear={nowY - 10}
          monthLabels={getMonthNames(i18n.language)}
          dayPlaceholder={t('picker.day')}
          monthPlaceholder={t('picker.month')}
          yearPlaceholder={t('picker.year')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        {/* Admin edit uses the full stored number; the split dial-code input is
            for user-facing capture (onboarding). */}
        <Input
          label={t('onboarding.phone')}
          keyboardType="phone-pad"
          value={form.phone_number}
          onChangeText={(v) => set('phone_number', v)}
        />
        <Input
          label={t('onboarding.guardianName')}
          value={form.parent_or_guardian_name}
          onChangeText={(v) => set('parent_or_guardian_name', v)}
        />
        <SearchSelect
          label={t('onboarding.nationality')}
          options={countryOptions}
          value={form.country_id}
          onChange={(v) => set('country_id', v)}
          placeholder={t('picker.select')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <SearchSelect
          label={t('admin.assignedCounselor')}
          options={counselorOptions}
          value={form.counselor_id}
          onChange={(v) => set('counselor_id', v)}
          placeholder={t('admin.unassigned')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <SearchSelect
          label={t('admin.highSchool')}
          options={hsOptions}
          value={form.high_school_id}
          onChange={(v) => set('high_school_id', v)}
          placeholder={t('admin.unassigned')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <Select
          label={t('onboarding.achievedLevel')}
          options={levelOptions}
          value={form.highest_education_level_id}
          onChange={(v) => set('highest_education_level_id', v)}
        />
        <Input
          label={t('onboarding.averageGrade')}
          keyboardType="numeric"
          value={form.average_grade}
          onChangeText={(v) => set('average_grade', v)}
        />
        <Select
          label={t('onboarding.englishLevel')}
          options={CEFR}
          value={form.cefr_level}
          onChange={(v) => set('cefr_level', v)}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 2 }}>
            <Input
              label={t('onboarding.budget')}
              keyboardType="numeric"
              value={form.budget}
              onChangeText={(v) => set('budget', v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label={t('onboarding.currency')}
              options={currencyOptions}
              value={form.budget_currency_id}
              onChange={(v) => set('budget_currency_id', v)}
            />
          </View>
        </View>
        <Select
          label={t('onboarding.financialPlan')}
          options={planOptions}
          value={form.financial_plan_id}
          onChange={(v) => set('financial_plan_id', v)}
        />
        <Select
          label={t('onboarding.intakeTerm')}
          options={INTAKE}
          value={form.desired_intake_term}
          onChange={(v) => set('desired_intake_term', v)}
        />
        <Select
          label={t('onboarding.intakeYear')}
          options={intakeYears}
          value={form.desired_intake_year}
          onChange={(v) => set('desired_intake_year', v)}
        />
        <Select
          label={t('onboarding.graduationYear')}
          options={gradYears}
          value={form.expected_graduation_year}
          onChange={(v) => set('expected_graduation_year', v)}
        />
      </>
    );
  }

  return (
    <EntityDetailScreen
      mode={mode}
      title={mode === 'create' ? t('admin.addStudent') : t('admin.editStudent')}
      emptyForm={EMPTY_FORM}
      initialForm={initialForm}
      optionsReady={optionsReady}
      validate={validate}
      toPayload={toPayload}
      create={create}
      update={update}
      remove={remove}
      entityId={studentId}
      renderFields={renderFields}
    />
  );
}
