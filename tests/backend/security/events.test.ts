import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { EMAILS, IDS } from '../helpers/ids';

describe('events: directory-style read (useEvents/useEvent/useEventsAdminList)', () => {
  it('any authenticated user reads the event list and a single event by id', async () => {
    const student = await signInAs(EMAILS.student1);
    const list = await student.from('events').select('id, title').order('start_date');
    expect(list.error).toBeNull();
    expect((list.data ?? []).map((e) => e.id)).toContain(IDS.event);

    const one = await student.from('events').select('*').eq('id', IDS.event).single();
    expect(one.error).toBeNull();
    expect(one.data?.id).toBe(IDS.event);
  });

  it('title search with ilike (the sanitized-search path) finds the seeded fair', async () => {
    const student = await signInAs(EMAILS.student1);
    const { data, error } = await student.from('events').select('id, title').ilike('title', '%Feria Lorem%');
    expect(error).toBeNull();
    expect((data ?? []).map((e) => e.id)).toContain(IDS.event);
  });
});

describe('events: admin-only writes (useCreateEvent/useUpdateEvent/useDeleteEvent)', () => {
  let createdEventId: string | undefined;

  afterAll(async () => {
    if (createdEventId) {
      await serviceClient().from('events').delete().eq('id', createdEventId);
    }
  });

  it('a student cannot create, update, or delete an event', async () => {
    const student = await signInAs(EMAILS.student1);

    const ins = await student
      .from('events')
      .insert({ title: 'Student-forged event', event_type: 'fair' })
      .select();
    expect(ins.error).not.toBeNull();

    const upd = await student
      .from('events')
      .update({ title: 'Hijacked title' })
      .eq('id', IDS.event)
      .select();
    expect(upd.error).toBeNull();
    expect((upd.data ?? []).length).toBe(0); // filtered out by RLS, not raised

    const del = await student.from('events').delete().eq('id', IDS.event).select();
    expect(del.error).toBeNull();
    expect((del.data ?? []).length).toBe(0);
  });

  it('an admin can create, update, and delete an event', async () => {
    const admin = await signInAs(EMAILS.admin);

    const created = await admin
      .from('events')
      .insert({ title: `Admin Test Event ${Date.now()}`, event_type: 'fair' })
      .select('id, title')
      .single();
    expect(created.error).toBeNull();
    createdEventId = created.data?.id;

    const updated = await admin
      .from('events')
      .update({ title: 'Renamed by admin' })
      .eq('id', createdEventId as string)
      .select('title')
      .single();
    expect(updated.error).toBeNull();
    expect(updated.data?.title).toBe('Renamed by admin');

    const deleted = await admin.from('events').delete().eq('id', createdEventId as string).select();
    expect(deleted.error).toBeNull();
    expect((deleted.data ?? []).length).toBe(1);
    createdEventId = undefined;
  });
});

describe('event_universities: admin-only writes, authenticated read (useEventUniversities/useAddEventUniversity/useRemoveEventUniversity)', () => {
  let tempEventId: string | undefined;

  afterAll(async () => {
    if (tempEventId) {
      await serviceClient().from('events').delete().eq('id', tempEventId);
    }
  });

  it('any authenticated user reads participating universities for the seeded event', async () => {
    const student = await signInAs(EMAILS.student1);
    const { data, error } = await student
      .from('event_universities')
      .select('universities(id, name)')
      .eq('event_id', IDS.event);
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.universities?.id);
    expect(ids).toContain(IDS.universities.un1);
    expect(ids).toContain(IDS.universities.un2);
  });

  it('a student cannot add or remove a participating university; an admin can', async () => {
    const svc = serviceClient();
    const tempEvent = await svc
      .from('events')
      .insert({ title: `Temp Event ${Date.now()}`, event_type: 'fair' })
      .select('id')
      .single();
    expect(tempEvent.error).toBeNull();
    tempEventId = tempEvent.data?.id;

    const student = await signInAs(EMAILS.student1);
    const studentAdd = await student
      .from('event_universities')
      .insert({ event_id: tempEventId as string, university_id: IDS.universities.un1 })
      .select();
    expect(studentAdd.error).not.toBeNull();

    const admin = await signInAs(EMAILS.admin);
    const adminAdd = await admin
      .from('event_universities')
      .insert({ event_id: tempEventId as string, university_id: IDS.universities.un1 })
      .select();
    expect(adminAdd.error).toBeNull();
    expect((adminAdd.data ?? []).length).toBe(1);

    const studentRemove = await student
      .from('event_universities')
      .delete()
      .eq('event_id', tempEventId as string)
      .eq('university_id', IDS.universities.un1)
      .select();
    expect(studentRemove.error).toBeNull();
    expect((studentRemove.data ?? []).length).toBe(0); // filtered, still there

    const adminRemove = await admin
      .from('event_universities')
      .delete()
      .eq('event_id', tempEventId as string)
      .eq('university_id', IDS.universities.un1)
      .select();
    expect(adminRemove.error).toBeNull();
    expect((adminRemove.data ?? []).length).toBe(1);
  });
});

describe('workshops: authenticated read, admin-only writes (useEventWorkshops/useCreateWorkshop/useDeleteWorkshop)', () => {
  it("any authenticated user reads an event's workshop schedule, earliest first", async () => {
    const student = await signInAs(EMAILS.student1);
    const { data, error } = await student
      .from('workshops')
      .select('id, title, start_time, end_time, universities(name)')
      .eq('event_id', IDS.event)
      .order('start_time');
    expect(error).toBeNull();
    expect((data ?? []).map((w) => w.id)).toEqual([IDS.workshops.w1, IDS.workshops.w2]);
  });

  it('a student cannot create or delete a workshop; an admin can', async () => {
    const student = await signInAs(EMAILS.student1);
    const studentCreate = await student
      .from('workshops')
      .insert({
        event_id: IDS.event,
        university_id: IDS.universities.un1,
        title: 'Student-forged workshop',
        start_time: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
        end_time: new Date(Date.now() + 90 * 24 * 3600 * 1000 + 3600 * 1000).toISOString(),
      })
      .select();
    expect(studentCreate.error).not.toBeNull();

    const admin = await signInAs(EMAILS.admin);
    const start = new Date(Date.now() + 90 * 24 * 3600 * 1000);
    const end = new Date(start.getTime() + 3600 * 1000);
    const created = await admin
      .from('workshops')
      .insert({
        event_id: IDS.event,
        university_id: IDS.universities.un1,
        title: `Admin Test Workshop ${Date.now()}`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .select('id')
      .single();
    expect(created.error).toBeNull();
    const workshopId = created.data?.id as string;

    const studentDelete = await student.from('workshops').delete().eq('id', workshopId).select();
    expect(studentDelete.error).toBeNull();
    expect((studentDelete.data ?? []).length).toBe(0);

    const adminDelete = await admin.from('workshops').delete().eq('id', workshopId).select();
    expect(adminDelete.error).toBeNull();
    expect((adminDelete.data ?? []).length).toBe(1);
  });
});

describe('one_to_ones: student-requested, staff-decided (useRequestMeeting/useCancelMeetingRequest/useDecideMeetingRequest)', () => {
  let requestId: string | undefined;

  // Clean every s2 request this block might create, before and after — the
  // partial unique index means a single leaked row from an interrupted run
  // would fail the create test (and cascade) on the next run.
  const cleanup = async () => {
    await serviceClient()
      .from('one_to_ones')
      .delete()
      .eq('event_id', IDS.event)
      .eq('student_id', IDS.students.s2);
  };
  beforeAll(cleanup);
  afterAll(async () => {
    await cleanup();
    requestId = undefined;
  });

  it('a student creates a pending request for themselves; status/room are forced to pending regardless of what they send', async () => {
    const student = await signInAs(EMAILS.student2);
    const created = await student
      .from('one_to_ones')
      .insert({
        event_id: IDS.event,
        university_id: IDS.universities.un1,
        student_id: IDS.students.s2,
        student_note: 'Quiero hablar de becas',
        // A student trying to self-approve + self-schedule: the
        // decision-authority trigger must blank all of this.
        status: 'approved',
        room: 'Salón 1',
        start_time: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      })
      .select('id, status, room, start_time, decided_by')
      .single();
    expect(created.error).toBeNull();
    expect(created.data?.status).toBe('pending');
    expect(created.data?.room).toBeNull();
    expect(created.data?.start_time).toBeNull();
    expect(created.data?.decided_by).toBeNull();
    requestId = created.data?.id;
  });

  it('a student cannot request a meeting on behalf of another student', async () => {
    const student = await signInAs(EMAILS.student2);
    const { error } = await student
      .from('one_to_ones')
      .insert({ event_id: IDS.event, university_id: IDS.universities.un2, student_id: IDS.students.s1 })
      .select();
    expect(error).not.toBeNull();
  });

  it('a second live request for the same university is rejected (partial unique index)', async () => {
    const student = await signInAs(EMAILS.student2);
    const { error } = await student
      .from('one_to_ones')
      .insert({ event_id: IDS.event, university_id: IDS.universities.un1, student_id: IDS.students.s2 })
      .select();
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23505');
  });

  it('the student may edit their own note but not the status/room/time', async () => {
    const student = await signInAs(EMAILS.student2);

    const noteEdit = await student
      .from('one_to_ones')
      .update({ student_note: 'Actualizado' })
      .eq('id', requestId as string)
      .select('student_note')
      .single();
    expect(noteEdit.error).toBeNull();
    expect(noteEdit.data?.student_note).toBe('Actualizado');

    const selfApprove = await student
      .from('one_to_ones')
      .update({ status: 'approved' })
      .eq('id', requestId as string)
      .select();
    expect(selfApprove.error).not.toBeNull();
    expect(selfApprove.error?.message ?? '').toMatch(/only staff may decide or schedule/i);
  });

  it('an unrelated student cannot see the request', async () => {
    const student3 = await signInAs(EMAILS.student3);
    const { data, error } = await student3.from('one_to_ones').select('id').eq('id', requestId as string);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);
  });

  it('an admin schedules and approves it, and the trigger stamps decided_by', async () => {
    const admin = await signInAs(EMAILS.admin);
    const start = new Date(Date.now() + 90 * 24 * 3600 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const approved = await admin
      .from('one_to_ones')
      .update({
        status: 'approved',
        room: 'Salón 9',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .eq('id', requestId as string)
      .select('status, room, decided_by, decided_at')
      .single();
    expect(approved.error).toBeNull();
    expect(approved.data?.status).toBe('approved');
    expect(approved.data?.room).toBe('Salón 9');
    expect(approved.data?.decided_by).not.toBeNull();
    expect(approved.data?.decided_at).not.toBeNull();
  });

  it('the student can withdraw their own request (delete)', async () => {
    const student = await signInAs(EMAILS.student2);
    const del = await student.from('one_to_ones').delete().eq('id', requestId as string).select();
    expect(del.error).toBeNull();
    expect((del.data ?? []).length).toBe(1);
    requestId = undefined;
  });
});

describe('event_registrations: student-owned (useMyEventRegistrations/useToggleEventRegistration)', () => {
  it("a student's own registrations query returns only their events", async () => {
    const student1 = await signInAs(EMAILS.student1);
    const { data, error } = await student1.from('event_registrations').select('event_id');
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.event_id)).toEqual([IDS.event]);
  });

  it('a student cannot register a different student for an event', async () => {
    const student2 = await signInAs(EMAILS.student2);
    const { error } = await student2
      .from('event_registrations')
      .insert({ student_id: IDS.students.s1, event_id: IDS.event })
      .select();
    expect(error).not.toBeNull();
  });

  it('a student can register and unregister themselves for an event (toggle flow)', async () => {
    const student2 = await signInAs(EMAILS.student2);

    const registered = await student2
      .from('event_registrations')
      .insert({ student_id: IDS.students.s2, event_id: IDS.event })
      .select();
    expect(registered.error).toBeNull();

    const afterRegister = await student2.from('event_registrations').select('event_id');
    expect((afterRegister.data ?? []).map((r) => r.event_id)).toContain(IDS.event);

    const unregistered = await student2
      .from('event_registrations')
      .delete()
      .eq('student_id', IDS.students.s2)
      .eq('event_id', IDS.event)
      .select();
    expect(unregistered.error).toBeNull();
    expect((unregistered.data ?? []).length).toBe(1);
  });
});

describe('workshop_registrations: student-requested, staff-decided, overlap-guarded (useRequestWorkshop/useCancelWorkshopRequest/useDecideWorkshopRequest)', () => {
  it("a student's own requests include both their approved and pending rows", async () => {
    const student1 = await signInAs(EMAILS.student1);
    const { data, error } = await student1
      .from('workshop_registrations')
      .select('workshop_id, status, workshops!inner(event_id)')
      .eq('workshops.event_id', IDS.event);
    expect(error).toBeNull();
    const byId = new Map((data ?? []).map((r) => [r.workshop_id, r.status]));
    expect(byId.get(IDS.workshops.w1)).toBe('approved');
    expect(byId.get(IDS.workshops.w2)).toBe('pending');
  });

  it('a request lands pending and a student cannot self-approve it', async () => {
    const student2 = await signInAs(EMAILS.student2);

    const requested = await student2
      .from('workshop_registrations')
      .insert({ student_id: IDS.students.s2, workshop_id: IDS.workshops.w2, status: 'approved' })
      .select('status, room')
      .single();
    expect(requested.error).toBeNull();
    expect(requested.data?.status).toBe('pending'); // trigger overrode 'approved'
    expect(requested.data?.room).toBeNull();

    const selfApprove = await student2
      .from('workshop_registrations')
      .update({ status: 'approved', room: 'Salón 1' })
      .eq('student_id', IDS.students.s2)
      .eq('workshop_id', IDS.workshops.w2)
      .select();
    expect(selfApprove.error).not.toBeNull();
    expect(selfApprove.error?.message ?? '').toMatch(/only staff may decide or schedule/i);

    // Cleanup for the next test's overlap check.
    await student2
      .from('workshop_registrations')
      .delete()
      .eq('student_id', IDS.students.s2)
      .eq('workshop_id', IDS.workshops.w2);
  });

  it('an admin approves a request with a room; the overlap guard only fires on approval', async () => {
    const student2 = await signInAs(EMAILS.student2);
    await student2
      .from('workshop_registrations')
      .insert({ student_id: IDS.students.s2, workshop_id: IDS.workshops.w1 });
    await student2
      .from('workshop_registrations')
      .insert({ student_id: IDS.students.s2, workshop_id: IDS.workshops.w2 });

    const admin = await signInAs(EMAILS.admin);
    // w1 and w2 don't overlap in the seed, so both approve cleanly.
    const approve1 = await admin
      .from('workshop_registrations')
      .update({ status: 'approved', room: 'Salón 4' })
      .eq('student_id', IDS.students.s2)
      .eq('workshop_id', IDS.workshops.w1)
      .select('status, room, decided_by')
      .single();
    expect(approve1.error).toBeNull();
    expect(approve1.data?.status).toBe('approved');
    expect(approve1.data?.room).toBe('Salón 4');
    expect(approve1.data?.decided_by).not.toBeNull();

    // Cleanup.
    await serviceClient()
      .from('workshop_registrations')
      .delete()
      .eq('student_id', IDS.students.s2)
      .in('workshop_id', [IDS.workshops.w1, IDS.workshops.w2]);
  });

  it('two pending requests may overlap; approving the second one that clashes is rejected', async () => {
    const svc = serviceClient();
    // Two workshops at the same time for the overlap test.
    const start = new Date(Date.now() + 120 * 24 * 3600 * 1000);
    const end = new Date(start.getTime() + 3600 * 1000);
    const wA = await svc
      .from('workshops')
      .insert({ event_id: IDS.event, title: 'Overlap A', start_time: start.toISOString(), end_time: end.toISOString() })
      .select('id')
      .single();
    const wB = await svc
      .from('workshops')
      .insert({ event_id: IDS.event, title: 'Overlap B', start_time: start.toISOString(), end_time: end.toISOString() })
      .select('id')
      .single();
    const wAId = wA.data?.id as string;
    const wBId = wB.data?.id as string;

    const student3 = await signInAs(EMAILS.student3);
    // Both pending — allowed, even though they overlap.
    const reqA = await student3
      .from('workshop_registrations')
      .insert({ student_id: IDS.students.s3, workshop_id: wAId })
      .select();
    const reqB = await student3
      .from('workshop_registrations')
      .insert({ student_id: IDS.students.s3, workshop_id: wBId })
      .select();
    expect(reqA.error).toBeNull();
    expect(reqB.error).toBeNull();

    const admin = await signInAs(EMAILS.admin);
    const approveA = await admin
      .from('workshop_registrations')
      .update({ status: 'approved' })
      .eq('student_id', IDS.students.s3)
      .eq('workshop_id', wAId)
      .select();
    expect(approveA.error).toBeNull();

    const approveB = await admin
      .from('workshop_registrations')
      .update({ status: 'approved' })
      .eq('student_id', IDS.students.s3)
      .eq('workshop_id', wBId)
      .select();
    expect(approveB.error).not.toBeNull(); // clashes with the now-approved A

    await svc.from('workshops').delete().in('id', [wAId, wBId]);
  });

  it('a student cannot request a workshop for a different student', async () => {
    const student2 = await signInAs(EMAILS.student2);
    const { error } = await student2
      .from('workshop_registrations')
      .insert({ student_id: IDS.students.s1, workshop_id: IDS.workshops.w2 })
      .select();
    expect(error).not.toBeNull();
  });
});

describe('event_notes: student-owned, counselor-visible (useEventNotes/useSaveEventNote)', () => {
  let extraNoteId: string | undefined;

  afterAll(async () => {
    if (extraNoteId) {
      await serviceClient().from('event_notes').delete().eq('id', extraNoteId);
    }
  });

  it("a student reads only their own notes for an event; their counselor can too", async () => {
    const student1 = await signInAs(EMAILS.student1);
    const own = await student1.from('event_notes').select('*').eq('event_id', IDS.event);
    expect(own.error).toBeNull();
    expect((own.data ?? []).length).toBe(1);
    expect(own.data?.[0]?.student_id).toBe(IDS.students.s1);

    const counselor = await signInAs(EMAILS.counselor);
    const viaCounselor = await counselor
      .from('event_notes')
      .select('student_id')
      .eq('event_id', IDS.event)
      .eq('student_id', IDS.students.s1);
    expect(viaCounselor.error).toBeNull();
    expect((viaCounselor.data ?? []).length).toBe(1);
  });

  it('an unrelated student does not see another student\'s note for the same event', async () => {
    const student2 = await signInAs(EMAILS.student2);
    const { data, error } = await student2
      .from('event_notes')
      .select('id')
      .eq('event_id', IDS.event)
      .eq('student_id', IDS.students.s1);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);
  });

  it('a student cannot create a note on behalf of a different student', async () => {
    const student2 = await signInAs(EMAILS.student2);
    const { error } = await student2
      .from('event_notes')
      .insert({
        student_id: IDS.students.s1,
        event_id: IDS.event,
        university_id: IDS.universities.un1,
        note: 'forged note',
        ranking: 1,
      })
      .select();
    expect(error).not.toBeNull();
  });

  it('a student can create and then update their own note/ranking (useSaveEventNote)', async () => {
    const student2 = await signInAs(EMAILS.student2);

    const created = await student2
      .from('event_notes')
      .insert({
        student_id: IDS.students.s2,
        event_id: IDS.event,
        university_id: IDS.universities.un2,
        note: 'Initial note',
        ranking: 2,
      })
      .select('id, note, ranking')
      .single();
    expect(created.error).toBeNull();
    expect(created.data?.note).toBe('Initial note');
    extraNoteId = created.data?.id;

    const updated = await student2
      .from('event_notes')
      .update({ note: 'Updated note', ranking: 3 })
      .eq('id', extraNoteId as string)
      .select('note, ranking')
      .single();
    expect(updated.error).toBeNull();
    expect(updated.data?.note).toBe('Updated note');
    expect(updated.data?.ranking).toBe(3);
  });
});
