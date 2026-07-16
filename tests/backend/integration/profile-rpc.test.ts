import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { EMAILS, IDS } from '../helpers/ids';

/**
 * Behavior of the `update_student_profile` RPC (profile edit): same validation
 * as onboarding, but strictly UPDATE semantics and — critically — NO lifecycle
 * side effects (no status_history append, onboarding_completed_at untouched).
 */

type StudentRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  phone_number: string | null;
  parent_or_guardian_name: string | null;
  country_id: string | null;
  highest_education_level_id: string | null;
  average_grade: number | null;
  cefr_level: string | null;
  budget: number | null;
  budget_currency_id: string | null;
  financial_plan_id: string | null;
  desired_intake_term: string | null;
  desired_intake_year: number | null;
  expected_graduation_year: number | null;
  onboarding_completed_at: string | null;
  parent_or_guardian_phone: string | null;
  consent_info_use: boolean;
  consent_info_use_at: string | null;
  personal_notes: string | null;
};

let original: StudentRow;
let originalPassports: string[] = [];
let originalCountries: string[] = [];
let originalFields: string[] = [];
let originalLevels: string[] = [];

/** A valid p_profile built from the student's current (seeded) row. */
function profileFrom(row: StudentRow): Record<string, string | null> {
  return {
    first_name: row.first_name,
    last_name: row.last_name,
    birth_date: row.birth_date,
    phone_number: row.phone_number,
    parent_or_guardian_name: row.parent_or_guardian_name,
    country_id: row.country_id,
    highest_education_level_id: row.highest_education_level_id,
    average_grade: String(row.average_grade),
    cefr_level: row.cefr_level,
    budget: String(row.budget),
    budget_currency_id: row.budget_currency_id,
    financial_plan_id: row.financial_plan_id,
    desired_intake_term: row.desired_intake_term,
    desired_intake_year: String(row.desired_intake_year),
    expected_graduation_year: String(row.expected_graduation_year),
  };
}

beforeAll(async () => {
  const svc = serviceClient();
  const row = await svc.from('students').select('*').eq('id', IDS.students.s1).single();
  expect(row.error).toBeNull();
  original = row.data as StudentRow;

  const [p, c, f, l] = await Promise.all([
    svc.from('student_passports').select('country_id').eq('student_id', IDS.students.s1),
    svc.from('student_countries_interest').select('country_id').eq('student_id', IDS.students.s1),
    svc
      .from('student_fields_of_study_interest')
      .select('field_of_study_id')
      .eq('student_id', IDS.students.s1),
    svc
      .from('student_education_level_interest')
      .select('education_level_id')
      .eq('student_id', IDS.students.s1),
  ]);
  originalPassports = (p.data ?? []).map((r) => r.country_id);
  originalCountries = (c.data ?? []).map((r) => r.country_id);
  originalFields = (f.data ?? []).map((r) => r.field_of_study_id);
  originalLevels = (l.data ?? []).map((r) => r.education_level_id);
  expect(originalPassports.length).toBeGreaterThan(0);
});

afterAll(async () => {
  // Restore the seeded scalar values the positive-path tests changed.
  const svc = serviceClient();
  await svc
    .from('students')
    .update({
      parent_or_guardian_name: original.parent_or_guardian_name,
      average_grade: original.average_grade,
      parent_or_guardian_phone: original.parent_or_guardian_phone,
      consent_info_use: original.consent_info_use,
      consent_info_use_at: original.consent_info_use_at,
      personal_notes: original.personal_notes,
    })
    .eq('id', IDS.students.s1);
});

/** Call the RPC as student1 with a valid base payload plus the given overrides. */
async function editAsStudent1(overrides: Record<string, unknown>) {
  const c = await signInAs(EMAILS.student1);
  return c.rpc('update_student_profile', {
    p_profile: { ...profileFrom(original), ...overrides },
    p_passport_country_ids: originalPassports,
    p_country_interest_ids: originalCountries,
    p_field_ids: originalFields,
    p_intended_level_ids: originalLevels,
  });
}

describe('update_student_profile RPC', () => {
  it('updates scalars + replaces interest rows without touching lifecycle', async () => {
    const svc = serviceClient();
    const historyBefore = await svc
      .from('status_history')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', IDS.students.s1);

    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c.rpc('update_student_profile', {
      p_profile: {
        ...profileFrom(original),
        parent_or_guardian_name: 'Edited Guardian',
        average_grade: '88',
      },
      p_passport_country_ids: originalPassports,
      p_country_interest_ids: originalCountries,
      p_field_ids: originalFields,
      p_intended_level_ids: originalLevels,
    });
    expect(error).toBeNull();
    expect(data?.parent_or_guardian_name).toBe('Edited Guardian');
    expect(Number(data?.average_grade)).toBe(88);
    // Lifecycle untouched:
    expect(data?.onboarding_completed_at).toBe(original.onboarding_completed_at);

    const historyAfter = await svc
      .from('status_history')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', IDS.students.s1);
    expect(historyAfter.count).toBe(historyBefore.count);

    // Join rows replaced (same ids in → same ids out, no dupes).
    const passports = await svc
      .from('student_passports')
      .select('country_id')
      .eq('student_id', IDS.students.s1);
    expect((passports.data ?? []).map((r) => r.country_id).sort()).toEqual(
      [...originalPassports].sort(),
    );
  });

  it('enforces the same validation as onboarding (blank first_name rejected)', async () => {
    const c = await signInAs(EMAILS.student1);
    const { error } = await c.rpc('update_student_profile', {
      p_profile: { ...profileFrom(original), first_name: '  ' },
      p_passport_country_ids: originalPassports,
      p_country_interest_ids: originalCountries,
      p_field_ids: originalFields,
      p_intended_level_ids: originalLevels,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toContain('first_name');
  });

  it('errors when the caller has no student profile yet (must onboard first)', async () => {
    const c = await signInAs(EMAILS.student4); // fresh signup, no students row
    const { error } = await c.rpc('update_student_profile', {
      p_profile: profileFrom(original),
      p_passport_country_ids: originalPassports,
      p_country_interest_ids: originalCountries,
      p_field_ids: originalFields,
      p_intended_level_ids: originalLevels,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toContain('no student profile');
  });

  it('rejects unauthenticated callers', async () => {
    const { anonClient } = await import('../helpers/clients');
    const { error } = await anonClient().rpc('update_student_profile', {
      p_profile: profileFrom(original),
    });
    expect(error).not.toBeNull();
  });

  // --- Profile-only fields (added 2026-07-16 for the "Mi información" design) ---
  describe('profile-only fields', () => {
    it('writes guardian phone and personal notes', async () => {
      const { data, error } = await editAsStudent1({
        parent_or_guardian_phone: '+52 998 765 4321',
        personal_notes: 'Me interesan las ciudades grandes.',
      });
      expect(error).toBeNull();
      // Non-digits are stripped, same as phone_number.
      expect(data?.parent_or_guardian_phone).toBe('+529987654321');
      expect(data?.personal_notes).toBe('Me interesan las ciudades grandes.');
    });

    it('accepts an absent guardian phone (onboarding never collected one)', async () => {
      const { data, error } = await editAsStudent1({ parent_or_guardian_phone: '' });
      expect(error).toBeNull();
      expect(data?.parent_or_guardian_phone).toBeNull();
    });

    it('rejects a malformed guardian phone', async () => {
      const { error } = await editAsStudent1({ parent_or_guardian_phone: '123' });
      expect(error).not.toBeNull();
      expect(error?.message).toContain('parent_or_guardian_phone');
    });

    it('stores blank personal notes as NULL rather than an empty string', async () => {
      const { data, error } = await editAsStudent1({ personal_notes: '   ' });
      expect(error).toBeNull();
      expect(data?.personal_notes).toBeNull();
    });

    it('stamps consent_info_use_at when consent is first granted', async () => {
      // Start from a known-revoked state.
      await editAsStudent1({ consent_info_use: false });
      const { data, error } = await editAsStudent1({ consent_info_use: true });
      expect(error).toBeNull();
      expect(data?.consent_info_use).toBe(true);
      expect(data?.consent_info_use_at).not.toBeNull();
    });

    it('leaves consent untouched when the key is omitted (an edit must not revoke it)', async () => {
      await editAsStudent1({ consent_info_use: true });
      const granted = await editAsStudent1({ consent_info_use: true });
      const grantedAt = granted.data?.consent_info_use_at;

      const { data, error } = await editAsStudent1({}); // no consent key at all
      expect(error).toBeNull();
      expect(data?.consent_info_use).toBe(true);
      // ...and re-granting doesn't re-stamp the original timestamp.
      expect(data?.consent_info_use_at).toBe(grantedAt);
    });

    it('clears the timestamp when consent is revoked', async () => {
      await editAsStudent1({ consent_info_use: true });
      const { data, error } = await editAsStudent1({ consent_info_use: false });
      expect(error).toBeNull();
      expect(data?.consent_info_use).toBe(false);
      expect(data?.consent_info_use_at).toBeNull();
    });
  });
});
