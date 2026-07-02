import { z } from 'zod';

export const onboardingSchema = z.object({
  first_name: z.string().trim().min(1, 'Required'),
  last_name: z.string().trim().min(1, 'Required'),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .or(z.literal('')),
  phone_number: z.string().trim(),
  parent_or_guardian_name: z.string().trim(),
  country_id: z.string().nullable(),
  passport_country_ids: z.array(z.string()),
  country_interest_ids: z.array(z.string()),
  field_ids: z.array(z.string()),
  intended_level_ids: z.array(z.string()),
  highest_education_level_id: z.string().nullable(),
  average_grade: z.string().trim(),
  cefr_level: z.string().nullable(),
  budget: z.string().nullable(),
  budget_currency_id: z.string().nullable(),
  financial_plan_id: z.string().nullable(),
  desired_intake_term: z.enum(['fall', 'winter', 'spring_summer']).nullable(),
  desired_intake_year: z.number().nullable(),
  expected_graduation_year: z.number().nullable(),
});

export type OnboardingForm = z.infer<typeof onboardingSchema>;

export const onboardingDefaults: OnboardingForm = {
  first_name: '',
  last_name: '',
  birth_date: '',
  phone_number: '',
  parent_or_guardian_name: '',
  country_id: null,
  passport_country_ids: [],
  country_interest_ids: [],
  field_ids: [],
  intended_level_ids: [],
  highest_education_level_id: null,
  average_grade: '',
  cefr_level: null,
  budget: null,
  budget_currency_id: null,
  financial_plan_id: null,
  desired_intake_term: null,
  desired_intake_year: null,
  expected_graduation_year: null,
};

export const CEFR_OPTIONS = [
  { label: 'Básico (A2)', value: 'A2' },
  { label: 'Intermedio (B1)', value: 'B1' },
  { label: 'Intermedio-Alto (B2)', value: 'B2' },
  { label: 'Avanzado (C1)', value: 'C1' },
  { label: 'Fluido (C2)', value: 'C2' },
];

// Value = numeric midpoint (stored in students.budget); label = the source bucket.
export const BUDGET_OPTIONS = [
  { label: '< 10K', value: '8000' },
  { label: '10K – 15K', value: '12500' },
  { label: '15K – 20K', value: '17500' },
  { label: '20K – 25K', value: '22500' },
  { label: '+ 25K', value: '27000' },
];

export const INTAKE_TERM_OPTIONS = [
  { label: 'Fall', value: 'fall' as const },
  { label: 'Winter', value: 'winter' as const },
  { label: 'Spring / Summer', value: 'spring_summer' as const },
];
