import { afterEach, describe, expect, it } from 'vitest';
import { anonClient, serviceClient, signInAs } from '../helpers/clients';
import { EMAILS, IDS } from '../helpers/ids';

/**
 * Access rules for the profile-screen child tables:
 *
 * - `student_references` ("Personas extra") is new in
 *   20260716000003_student_profile_fields.sql and gets the standard student-keyed
 *   policy (self + assigned counselor + admin) spelled out rather than added to
 *   the already-applied loop in 20260701000009_rls_policies.sql — so it's worth
 *   proving it actually behaves like its siblings.
 * - `student_language_exams` is pre-existing but had no hooks until now; these
 *   assert a student can manage their own exam rows and nobody else's.
 *
 * Seeded fixture: counselor@wrsi.dev is assigned to student1, not student2.
 */

const created: string[] = [];

afterEach(async () => {
  const svc = serviceClient();
  if (created.length > 0) {
    await svc.from('student_references').delete().in('id', created);
    created.length = 0;
  }
  await svc.from('student_language_exams').delete().eq('student_id', IDS.students.s1);
});

async function firstLanguageExamId(): Promise<string> {
  const { data, error } = await serviceClient()
    .from('language_exams')
    .select('id')
    .eq('name', 'IELTS')
    .single();
  expect(error).toBeNull();
  return data!.id;
}

describe('student_references RLS', () => {
  it('a student can create and read their own references', async () => {
    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c
      .from('student_references')
      .insert({
        student_id: IDS.students.s1,
        full_name: 'María Garza',
        relationship: 'Tía',
        email: 'maria@example.com',
      })
      .select()
      .single();
    expect(error).toBeNull();
    created.push(data!.id);

    const read = await c.from('student_references').select('*');
    expect(read.error).toBeNull();
    expect(read.data?.map((r) => r.full_name)).toContain('María Garza');
  });

  it('a student cannot create a reference against another student', async () => {
    const c = await signInAs(EMAILS.student1);
    const { error } = await c
      .from('student_references')
      .insert({ student_id: IDS.students.s2, full_name: 'Not Mine' });
    expect(error).not.toBeNull();
  });

  it("a student cannot read another student's references", async () => {
    const svc = serviceClient();
    const seeded = await svc
      .from('student_references')
      .insert({ student_id: IDS.students.s2, full_name: 'Student2 Reference' })
      .select()
      .single();
    created.push(seeded.data!.id);

    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c.from('student_references').select('*');
    expect(error).toBeNull(); // RLS filters rather than errors
    expect(data?.map((r) => r.full_name)).not.toContain('Student2 Reference');
  });

  it("the assigned counselor can read their student's references; admin can read any", async () => {
    const svc = serviceClient();
    const seeded = await svc
      .from('student_references')
      .insert({ student_id: IDS.students.s1, full_name: 'Visible To Staff' })
      .select()
      .single();
    created.push(seeded.data!.id);

    const counselor = await signInAs(EMAILS.counselor);
    const counselorRead = await counselor
      .from('student_references')
      .select('full_name')
      .eq('student_id', IDS.students.s1);
    expect(counselorRead.data?.map((r) => r.full_name)).toContain('Visible To Staff');

    const admin = await signInAs(EMAILS.admin);
    const adminRead = await admin
      .from('student_references')
      .select('full_name')
      .eq('student_id', IDS.students.s1);
    expect(adminRead.data?.map((r) => r.full_name)).toContain('Visible To Staff');
  });

  it('rejects anonymous reads', async () => {
    const { data } = await anonClient().from('student_references').select('*');
    expect(data ?? []).toHaveLength(0);
  });

  it('a student can delete their own reference', async () => {
    const c = await signInAs(EMAILS.student1);
    const inserted = await c
      .from('student_references')
      .insert({ student_id: IDS.students.s1, full_name: 'Temporary' })
      .select()
      .single();

    const { error } = await c.from('student_references').delete().eq('id', inserted.data!.id);
    expect(error).toBeNull();

    const check = await serviceClient()
      .from('student_references')
      .select('id')
      .eq('id', inserted.data!.id);
    expect(check.data ?? []).toHaveLength(0);
  });
});

describe('student_language_exams', () => {
  it('a student can upsert their own exam score, and re-saving updates rather than duplicates', async () => {
    const examId = await firstLanguageExamId();
    const c = await signInAs(EMAILS.student1);

    const first = await c
      .from('student_language_exams')
      .upsert(
        { student_id: IDS.students.s1, language_exam_id: examId, score: 7.0 },
        { onConflict: 'student_id,language_exam_id' },
      );
    expect(first.error).toBeNull();

    const second = await c
      .from('student_language_exams')
      .upsert(
        { student_id: IDS.students.s1, language_exam_id: examId, score: 7.5 },
        { onConflict: 'student_id,language_exam_id' },
      );
    expect(second.error).toBeNull();

    const rows = await serviceClient()
      .from('student_language_exams')
      .select('score')
      .eq('student_id', IDS.students.s1);
    expect(rows.data).toHaveLength(1);
    expect(Number(rows.data![0]!.score)).toBe(7.5);
  });

  it("a student cannot write an exam row for another student", async () => {
    const examId = await firstLanguageExamId();
    const c = await signInAs(EMAILS.student1);
    const { error } = await c
      .from('student_language_exams')
      .insert({ student_id: IDS.students.s2, language_exam_id: examId, score: 9.0 });
    expect(error).not.toBeNull();
  });
});
