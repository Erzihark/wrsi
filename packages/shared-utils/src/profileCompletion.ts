/**
 * Profile-completion metric for the dashboard's "Completa tu perfil" card and
 * the profile screen ("X de 6 secciones completas" + percent ring).
 *
 * Completion is measured over 6 fixed SECTIONS (not raw columns), so partially
 * filling one topic doesn't inflate the score. A section counts as complete
 * when every field in it is filled.
 *
 * The section list mirrors what the "Mi información" screen actually shows, and
 * that's load-bearing in two ways:
 *
 * 1. There's no `financial` section. Budget / financial plan are collected at
 *    onboarding but the profile screen doesn't display them, so counting them
 *    would move a number the student can't see a reason for.
 * 2. The sections that can actually be incomplete are the ones onboarding never
 *    collected (guardian phone, consent, an exam score, photo, notes).
 *    Onboarding hard-requires everything in `personal` and `academic`, so those
 *    read as complete for any onboarded student — matching the design, which
 *    shows those rows as "Completado" and leaves the new ones "Pendiente".
 *
 * Provisional: the design shows "4 de 6" at 68%, which is neither a plain
 * section ratio (4/6 = 67%) nor a row ratio — treat its numbers as
 * illustrative. Revisit if the client defines the sections explicitly.
 */

/** The subset of the `students` row the completion metric reads. */
export interface ProfileCompletionInput {
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  phone_number: string | null;
  parent_or_guardian_name: string | null;
  parent_or_guardian_phone: string | null;
  consent_info_use: boolean | null;
  country_id: string | null;
  highest_education_level_id: string | null;
  average_grade: number | null;
  desired_intake_term: string | null;
  desired_intake_year: number | null;
  cefr_level: string | null;
  photo_url: string | null;
  personal_notes: string | null;
}

/**
 * Counts from the student's child tables. Both default to 0, which reads as
 * "not provided" — callers that can't cheaply fetch them get a conservative
 * (never inflated) score.
 */
export interface ProfileCompletionCounts {
  /** Rows in `student_language_exams` (the design's "IELTS 7.0"). */
  languageExamCount?: number;
  /** Rows in `student_references` (the design's "Personas extra"). */
  referenceCount?: number;
}

export type ProfileSectionKey =
  | 'personal'
  | 'guardian'
  | 'consent'
  | 'academic'
  | 'english'
  | 'extras';

const SECTION_FIELDS: Record<ProfileSectionKey, (keyof ProfileCompletionInput)[]> = {
  personal: ['first_name', 'last_name', 'birth_date', 'phone_number'],
  guardian: ['parent_or_guardian_name', 'parent_or_guardian_phone'],
  consent: ['consent_info_use'],
  academic: [
    'country_id',
    'highest_education_level_id',
    'average_grade',
    'desired_intake_term',
    'desired_intake_year',
  ],
  english: ['cefr_level'],
  extras: ['photo_url', 'personal_notes'],
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

function filled(value: string | number | boolean | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  // `false` is an unchecked consent box, not a filled field.
  if (typeof value === 'boolean') return value;
  return typeof value === 'string' ? value.trim() !== '' : true;
}

export function computeProfileCompletion(
  student: ProfileCompletionInput | null | undefined,
  counts: ProfileCompletionCounts = {},
): ProfileCompletion {
  const { languageExamCount = 0, referenceCount = 0 } = counts;

  const sections = PROFILE_SECTION_KEYS.map((key) => {
    const fieldsFilled =
      student != null && SECTION_FIELDS[key].every((f) => filled(student[f]));

    // Two sections also depend on child-table rows the students row can't carry.
    const extraFilled =
      key === 'english' ? languageExamCount > 0 : key === 'extras' ? referenceCount > 0 : true;

    return { key, complete: fieldsFilled && extraFilled };
  });

  const completed = sections.filter((s) => s.complete).length;
  const total = sections.length;
  return { completed, total, percent: Math.round((completed / total) * 100), sections };
}
