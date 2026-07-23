import { afterAll, describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { EMAILS, IDS } from '../helpers/ids';

describe('RLS: students row visibility', () => {
  it('a student sees only their own students row', async () => {
    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c.from('students').select('id');
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.id)).toEqual([IDS.students.s1]);
  });

  it('a counselor sees assigned students but not an unassigned one', async () => {
    const c = await signInAs(EMAILS.counselor);
    const { data, error } = await c.from('students').select('id');
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id).sort();
    expect(ids).toEqual([IDS.students.s1, IDS.students.s2].sort());
    expect(ids).not.toContain(IDS.students.s3);
  });

  it('an admin sees every student', async () => {
    const c = await signInAs(EMAILS.admin);
    const { data, error } = await c.from('students').select('id');
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id);
    for (const id of [IDS.students.s1, IDS.students.s2, IDS.students.s3]) {
      expect(ids).toContain(id);
    }
  });
});

describe('RLS: admin-only tables are invisible to non-admins', () => {
  let sponsorId: string | undefined;

  afterAll(async () => {
    if (sponsorId) {
      await serviceClient().from('sponsors_and_allies').delete().eq('id', sponsorId);
    }
  });

  it('a student cannot read sponsors_and_allies, but an admin can', async () => {
    // Seed a row with the service role (bypasses RLS) so the deny/allow contrast
    // is provable rather than an empty table.
    const svc = serviceClient();
    const ins = await svc
      .from('sponsors_and_allies')
      .insert({ name: `RLS Sponsor ${Date.now()}` })
      .select('id')
      .single();
    expect(ins.error).toBeNull();
    sponsorId = ins.data?.id;

    // A student holds a `user_roles` JWT claim, yet RLS keys off auth.uid()/DB
    // roles — so the row stays hidden. This also demonstrates the claim can't be
    // leveraged into elevated DB access.
    const student = await signInAs(EMAILS.student1);
    const asStudent = await student
      .from('sponsors_and_allies')
      .select('id')
      .eq('id', sponsorId as string);
    expect(asStudent.error).toBeNull();
    expect((asStudent.data ?? []).length).toBe(0);

    const admin = await signInAs(EMAILS.admin);
    const asAdmin = await admin
      .from('sponsors_and_allies')
      .select('id')
      .eq('id', sponsorId as string);
    expect((asAdmin.data ?? []).map((r) => r.id)).toContain(sponsorId);
  });
});

describe('RLS + trigger: student record write guards', () => {
  afterAll(async () => {
    // Restore any values a positive-path test changed.
    await serviceClient()
      .from('students')
      .update({ average_grade: 91.5 })
      .eq('id', IDS.students.s1);
  });

  it('a student may update a non-restricted column on their own row', async () => {
    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c
      .from('students')
      .update({ average_grade: 92.5 })
      .eq('id', IDS.students.s1)
      .select('average_grade');
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(1);
  });

  it('a student cannot reassign their own counselor (guard trigger)', async () => {
    const c = await signInAs(EMAILS.student1);
    const { error } = await c
      .from('students')
      .update({ counselor_id: null })
      .eq('id', IDS.students.s1)
      .select();
    expect(error).not.toBeNull();
    expect(error?.message ?? '').toMatch(/admin can change student assignment/i);
  });

  it('a counselor cannot update the students row (record edits are admin-only)', async () => {
    const c = await signInAs(EMAILS.counselor);
    const { data, error } = await c
      .from('students')
      .update({ average_grade: 50 })
      .eq('id', IDS.students.s1)
      .select();
    // RLS filters the row out of the UPDATE rather than raising: no row changes.
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);
  });
});

describe('RLS: owner-portal writes', () => {
  const originalDescription =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.';

  afterAll(async () => {
    await serviceClient()
      .from('universities')
      .update({ description: originalDescription })
      .eq('id', IDS.universities.un1);
  });

  it('a university account edits its own row but not another university', async () => {
    const c = await signInAs(EMAILS.university1);

    const own = await c
      .from('universities')
      .update({ description: 'Updated by owner-portal test' })
      .eq('id', IDS.universities.un1)
      .select('id');
    expect(own.error).toBeNull();
    expect((own.data ?? []).map((r) => r.id)).toEqual([IDS.universities.un1]);

    const other = await c
      .from('universities')
      .update({ description: 'hijack attempt' })
      .eq('id', IDS.universities.un2)
      .select('id');
    expect(other.error).toBeNull();
    expect((other.data ?? []).length).toBe(0);
  });
});

describe('trigger: workshop time-overlap prevention', () => {
  let overlapWorkshopId: string | undefined;

  afterAll(async () => {
    if (overlapWorkshopId) {
      await serviceClient().from('workshops').delete().eq('id', overlapWorkshopId);
    }
  });

  it('lets a student request an overlapping workshop, but blocks approving it against an already-approved one', async () => {
    const svc = serviceClient();
    // student1 is seeded with workshop w1 *approved*; create a second workshop
    // at the exact same time so an approval must collide.
    const w1 = await svc
      .from('workshops')
      .select('start_time, end_time')
      .eq('id', IDS.workshops.w1)
      .single();
    expect(w1.error).toBeNull();

    const created = await svc
      .from('workshops')
      .insert({
        event_id: IDS.event,
        university_id: IDS.universities.un1,
        title: `Overlap Test ${Date.now()}`,
        start_time: w1.data!.start_time,
        end_time: w1.data!.end_time,
      })
      .select('id')
      .single();
    expect(created.error).toBeNull();
    overlapWorkshopId = created.data?.id;

    // The pending request is allowed — pending rows don't collide (staff resolve
    // conflicts by choosing which to approve).
    const student = await signInAs(EMAILS.student1);
    const reg = await student
      .from('workshop_registrations')
      .insert({ student_id: IDS.students.s1, workshop_id: overlapWorkshopId as string })
      .select('status');
    expect(reg.error).toBeNull();
    expect(reg.data?.[0]?.status).toBe('pending');

    // Approving it, while w1 is already approved at the same time, trips the guard.
    const admin = await signInAs(EMAILS.admin);
    const approve = await admin
      .from('workshop_registrations')
      .update({ status: 'approved' })
      .eq('student_id', IDS.students.s1)
      .eq('workshop_id', overlapWorkshopId as string)
      .select();
    expect(approve.error).not.toBeNull();
    expect(approve.error?.message ?? '').toMatch(/overlapping/i);

    await svc
      .from('workshop_registrations')
      .delete()
      .eq('student_id', IDS.students.s1)
      .eq('workshop_id', overlapWorkshopId as string);
  });
});
