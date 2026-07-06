import { z } from 'zod';

// Error messages are i18n KEYS — translate at render time with t(message).
const REQUIRED = 'validation.required';
const AT_LEAST_ONE = 'validation.selectAtLeastOne';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function isPlausibleBirthDate(value: string): boolean {
  if (!isoDate.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const min = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  const max = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
  return d >= min && d <= max;
}

const requiredId = z
  .string()
  .nullable()
  .refine((v): v is string => v != null && v.length > 0, REQUIRED);

export const onboardingSchema = z.object({
  first_name: z.string().trim().min(1, REQUIRED),
  last_name: z.string().trim().min(1, REQUIRED),
  birth_date: z
    .string()
    .min(1, 'validation.invalidDate')
    .regex(isoDate, 'validation.invalidDate')
    .refine(isPlausibleBirthDate, 'validation.birthDateRange'),
  phone_number: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .refine(
      (v) => /^\+?[0-9]{8,15}$/.test(v.replace(/[^0-9+]/g, '')),
      'validation.phoneInvalid',
    ),
  parent_or_guardian_name: z.string().trim().min(1, REQUIRED),
  country_id: requiredId,
  passport_country_ids: z.array(z.string()).min(1, AT_LEAST_ONE),
  country_interest_ids: z.array(z.string()).min(1, AT_LEAST_ONE),
  field_ids: z.array(z.string()).min(1, AT_LEAST_ONE),
  intended_level_ids: z.array(z.string()).min(1, AT_LEAST_ONE),
  highest_education_level_id: requiredId,
  average_grade: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 100;
    }, 'validation.gradeRange'),
  cefr_level: requiredId,
  budget: requiredId,
  budget_currency_id: requiredId,
  financial_plan_id: requiredId,
  desired_intake_term: z
    .enum(['fall', 'winter', 'spring_summer'])
    .nullable()
    .refine((v): v is 'fall' | 'winter' | 'spring_summer' => v != null, REQUIRED),
  desired_intake_year: z
    .number()
    .nullable()
    .refine((v): v is number => v != null, REQUIRED),
  expected_graduation_year: z
    .number()
    .nullable()
    .refine((v): v is number => v != null, REQUIRED),
});

/** What the form holds while editing (nullable until the user picks). */
export type OnboardingFormInput = z.input<typeof onboardingSchema>;
/** What a successful validation produces (all fields present + narrowed). */
export type OnboardingForm = z.output<typeof onboardingSchema>;

export const onboardingDefaults: OnboardingFormInput = {
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

/** Fields validated when leaving each wizard step. */
export const STEP_FIELDS: (keyof OnboardingFormInput)[][] = [
  [
    'first_name',
    'last_name',
    'birth_date',
    'phone_number',
    'parent_or_guardian_name',
    'country_id',
    'passport_country_ids',
  ],
  [
    'intended_level_ids',
    'field_ids',
    'country_interest_ids',
    'desired_intake_term',
    'desired_intake_year',
    'expected_graduation_year',
  ],
  [
    'highest_education_level_id',
    'average_grade',
    'cefr_level',
    'budget',
    'budget_currency_id',
    'financial_plan_id',
  ],
];

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
