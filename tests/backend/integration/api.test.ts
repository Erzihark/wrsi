import { describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { EMAILS, IDS } from '../helpers/ids';

describe('universities directory (read path behind useUniversities)', () => {
  it('returns the seeded partner universities to a signed-in student', async () => {
    const client = await signInAs(EMAILS.student1);
    const { data, error } = await client
      .from('universities')
      .select('id, name')
      .order('name');
    expect(error).toBeNull();
    const names = (data ?? []).map((u) => u.name);
    expect(names).toContain('Universidad Lorem');
    expect(names).toContain('Amet Elit University');
  });

  it('filters by name with ilike (the sanitized-search query path)', async () => {
    const client = await signInAs(EMAILS.student1);
    const { data, error } = await client
      .from('universities')
      .select('name')
      .ilike('name', '%Lorem%');
    expect(error).toBeNull();
    expect((data ?? []).map((u) => u.name)).toEqual(['Universidad Lorem']);
  });
});

describe('student_directory (admin CRM list behind useStudentsList)', () => {
  it('an admin sees all seeded students', async () => {
    const admin = await signInAs(EMAILS.admin);
    const { data, error, count } = await admin
      .from('student_directory')
      .select('id, counselor_id', { count: 'exact' });
    expect(error).toBeNull();
    expect(count ?? 0).toBeGreaterThanOrEqual(3);
    const ids = (data ?? []).map((r) => r.id);
    for (const id of [IDS.students.s1, IDS.students.s2, IDS.students.s3]) {
      expect(ids).toContain(id);
    }
  });

  it('narrows to a counselor\'s assigned students when filtered', async () => {
    const admin = await signInAs(EMAILS.admin);
    const assigned = await admin
      .from('student_directory')
      .select('id')
      .eq('counselor_id', IDS.counselor);
    expect(assigned.error).toBeNull();
    expect((assigned.data ?? []).map((r) => r.id).sort()).toEqual(
      [IDS.students.s1, IDS.students.s2].sort(),
    );

    const unassigned = await admin
      .from('student_directory')
      .select('id')
      .is('counselor_id', null);
    expect((unassigned.data ?? []).map((r) => r.id)).toContain(IDS.students.s3);
  });
});

describe('complete_student_onboarding RPC (server-side validation)', () => {
  it('rejects a profile missing required fields', async () => {
    const client = await signInAs(EMAILS.student4);
    const { error } = await client.rpc('complete_student_onboarding', {
      // Missing first_name (and most required fields) -> DB validation must reject.
      p_profile: { last_name: 'Test', parent_or_guardian_name: 'Guardian' },
    });
    expect(error).not.toBeNull();
    expect(error?.message ?? '').toMatch(/first_name is required/i);
  });

  it('leaves the fresh account without a students row when validation fails', async () => {
    const { data } = await serviceClient()
      .from('students')
      .select('id')
      .eq('user_id', IDS.users.s4);
    expect((data ?? []).length).toBe(0);
  });
});
