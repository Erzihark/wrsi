import { z } from 'zod';
import { emptyPhone, numericField, phoneFieldOptional } from '@wrsi/shared-utils';
import { onboardingSchema, type OnboardingFormInput } from '../onboarding/schema';

/**
 * The profile edit form = everything onboarding collects (the RPC still
 * hard-requires all of it, so the form must round-trip it) plus the fields only
 * the profile screen offers.
 *
 * The extra fields are optional: onboarding never collected them, so requiring
 * them would block the first save for every existing student.
 *
 * Not here: `high_school_id` (staff-owned — the guard trigger rejects a student
 * changing it) and references (their own table, edited as a list rather than a
 * form field).
 */
export const profileEditSchema = onboardingSchema.extend({
  guardian_phone: phoneFieldOptional(),
  consent_info_use: z.boolean(),
  personal_notes: z.string().trim(),
  english_exam_id: z.string().nullable(),
  // IELTS 0–9, TOEFL 0–120, PTE 10–90 — one numeric column, so bound it widely
  // and let the score's own scale speak for itself.
  english_exam_score: numericField({ min: 0, max: 120 }, 'validation.scoreRange'),
});

export type ProfileEditFormInput = z.input<typeof profileEditSchema>;
export type ProfileEditForm = z.output<typeof profileEditSchema>;

export const profileEditExtraDefaults = {
  guardian_phone: emptyPhone(),
  consent_info_use: false,
  personal_notes: '',
  english_exam_id: null,
  english_exam_score: '',
};

export function profileEditDefaults(onboarding: OnboardingFormInput): ProfileEditFormInput {
  return { ...onboarding, ...profileEditExtraDefaults };
}
