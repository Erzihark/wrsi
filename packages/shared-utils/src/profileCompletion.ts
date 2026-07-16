/**
 * Profile-completion metric for the student dashboard's "Completa tu perfil"
 * card and the profile screen ("X de 6 completados" + percent ring).
 *
 * Completion is measured over 6 fixed SECTIONS of the `students` row (not raw
 * columns), so partially filling one topic doesn't inflate the score. A section
 * counts as complete when every field in it is non-null/non-empty. The section
 * list is a product decision — keep it in sync with the profile screen's
 * summary sections.
 */

/** The subset of the `students` row the completion metric reads. */
export interface ProfileCompletionInput {
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  phone_number: string | null;
  parent_or_guardian_name: string | null;
  average_grade: number | null;
  cefr_level: string | null;
  highest_education_level_id: string | null;
  desired_intake_term: string | null;
  desired_intake_year: number | null;
  expected_graduation_year: number | null;
  budget: number | null;
  budget_currency_id: string | null;
  financial_plan_id: string | null;
  photo_url: string | null;
}

export type ProfileSectionKey =
  | 'personal'
  | 'guardian'
  | 'academic'
  | 'goals'
  | 'financial'
  | 'photo';

const SECTION_FIELDS: Record<ProfileSectionKey, (keyof ProfileCompletionInput)[]> = {
  personal: ['first_name', 'last_name', 'birth_date', 'phone_number'],
  guardian: ['parent_or_guardian_name'],
  academic: ['average_grade', 'cefr_level', 'highest_education_level_id'],
  goals: ['desired_intake_term', 'desired_intake_year', 'expected_graduation_year'],
  financial: ['budget', 'budget_currency_id', 'financial_plan_id'],
  photo: ['photo_url'],
};

export const PROFILE_SECTION_KEYS = Object.keys(SECTION_FIELDS) as ProfileSectionKey[];

export interface ProfileCompletion {
  /** Sections fully filled in. */
  completed: number;
  /** Total sections (currently 6). */
  total: number;
  /** 0–100, rounded. */
  percent: number;
  /** Per-section completeness, in display order. */
  sections: { key: ProfileSectionKey; complete: boolean }[];
}

function filled(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  return typeof value === 'string' ? value.trim() !== '' : true;
}

export function computeProfileCompletion(
  student: ProfileCompletionInput | null | undefined,
): ProfileCompletion {
  const sections = PROFILE_SECTION_KEYS.map((key) => ({
    key,
    complete: student != null && SECTION_FIELDS[key].every((f) => filled(student[f])),
  }));
  const completed = sections.filter((s) => s.complete).length;
  const total = sections.length;
  return { completed, total, percent: Math.round((completed / total) * 100), sections };
}
