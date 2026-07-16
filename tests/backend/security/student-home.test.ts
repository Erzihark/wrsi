import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { EMAILS, IDS } from '../helpers/ids';

/**
 * Security coverage for the student-home backend additions:
 * - student_applications read scoping (first hooks over an existing table)
 * - notifications mark-read (owner-only update) + unread count
 * - avatars Storage bucket policies (own folder or admin)
 * - events new display columns (admin write, all-authed read)
 * - students.photo_url stays student-writable (not guard-restricted)
 */

describe('RLS: student_applications visibility', () => {
  let applicationId: string | undefined;

  beforeAll(async () => {
    const svc = serviceClient();
    const status = await svc
      .from('statuses')
      .select('id')
      .eq('entity_type', 'application')
      .eq('name', 'Submitted')
      .single();
    expect(status.error).toBeNull();
    const ins = await svc
      .from('student_applications')
      .insert({
        student_id: IDS.students.s1,
        university_id: IDS.universities.un1,
        status_id: status.data!.id,
        intake_year: 2027,
        intake_term: 'fall',
      })
      .select('id')
      .single();
    expect(ins.error).toBeNull();
    applicationId = ins.data?.id;
  });

  afterAll(async () => {
    if (applicationId) {
      await serviceClient().from('student_applications').delete().eq('id', applicationId);
    }
  });

  it('the student reads their own application with embedded status + university', async () => {
    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c
      .from('student_applications')
      .select('id, status:statuses(name, color), university:universities(name, logo_url)');
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.id)).toContain(applicationId);
    const row = (data ?? []).find((r) => r.id === applicationId);
    expect(row?.status?.name).toBe('Submitted');
    expect(row?.university?.name).toBeTruthy();
  });

  it('another student cannot see it', async () => {
    const c = await signInAs(EMAILS.student2);
    const { data, error } = await c
      .from('student_applications')
      .select('id')
      .eq('id', applicationId as string);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);
  });

  it('the assigned counselor and an admin can see it', async () => {
    for (const email of [EMAILS.counselor, EMAILS.admin]) {
      const c = await signInAs(email);
      const { data, error } = await c
        .from('student_applications')
        .select('id')
        .eq('id', applicationId as string);
      expect(error).toBeNull();
      expect((data ?? []).map((r) => r.id)).toContain(applicationId);
    }
  });

  it('a student cannot insert an application for another student', async () => {
    const c = await signInAs(EMAILS.student2);
    const { error } = await c.from('student_applications').insert({
      student_id: IDS.students.s1, // someone else's
      university_id: IDS.universities.un1,
    });
    expect(error).not.toBeNull();
  });
});

describe('notifications: unread count + owner-only mark-read', () => {
  const seeded: string[] = [];
  let baseline = 0; // s1's unread rows that existed before this suite seeded any

  beforeAll(async () => {
    const svc = serviceClient();
    const pre = await signInAs(EMAILS.student1);
    const { count } = await pre
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    baseline = count ?? 0;
    const ins = await svc
      .from('notifications')
      .insert([
        { user_id: IDS.users.s1, type: 'test', title: 'Unread A', body: 'a' },
        { user_id: IDS.users.s1, type: 'test', title: 'Unread B', body: 'b' },
        { user_id: IDS.users.s2, type: 'test', title: 'Other student', body: 'c' },
      ])
      .select('id');
    expect(ins.error).toBeNull();
    seeded.push(...(ins.data ?? []).map((r) => r.id));
  });

  afterAll(async () => {
    if (seeded.length) {
      await serviceClient().from('notifications').delete().in('id', seeded);
    }
  });

  it('head count of unread rows is scoped to the caller', async () => {
    const c = await signInAs(EMAILS.student1);
    const { count, error } = await c
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    expect(error).toBeNull();
    expect(count).toBe(baseline + 2); // only s1's two, not s2's
  });

  it('the owner can mark one read and the unread count drops', async () => {
    const c = await signInAs(EMAILS.student1);
    const target = seeded[0]!;
    const upd = await c
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', target)
      .select('id, is_read');
    expect(upd.error).toBeNull();
    expect(upd.data?.[0]?.is_read).toBe(true);

    const { count } = await c
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    expect(count).toBe(baseline + 1);
  });

  it("a user cannot mark someone else's notification read", async () => {
    const c = await signInAs(EMAILS.student1);
    const foreign = seeded[2]!; // s2's row
    const { data, error } = await c
      .from('notifications')
      .update({ is_read: true })
      .eq('id', foreign)
      .select('id');
    // RLS filters the row out of the UPDATE — no error, zero rows affected.
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);

    const svc = await serviceClient()
      .from('notifications')
      .select('is_read')
      .eq('id', foreign)
      .single();
    expect(svc.data?.is_read).toBe(false);
  });

  it('mark-all-read clears only the caller’s unread rows', async () => {
    const c = await signInAs(EMAILS.student1);
    const { error } = await c
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false);
    expect(error).toBeNull();

    const { count } = await c
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    expect(count).toBe(0);

    // s2's row is untouched.
    const svc = await serviceClient()
      .from('notifications')
      .select('is_read')
      .eq('id', seeded[2]!)
      .single();
    expect(svc.data?.is_read).toBe(false);
  });
});

describe('avatars Storage bucket: own-folder-or-admin writes, public read', () => {
  const uploaded: string[] = [];
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  afterAll(async () => {
    if (uploaded.length) {
      await serviceClient().storage.from('avatars').remove(uploaded);
    }
    await serviceClient().from('students').update({ photo_url: null }).eq('id', IDS.students.s1);
  });

  it('a student can upload into their own folder', async () => {
    const c = await signInAs(EMAILS.student1);
    const path = `${IDS.users.s1}/avatar-test-${Date.now()}.png`;
    const { error } = await c.storage
      .from('avatars')
      .upload(path, png, { contentType: 'image/png' });
    expect(error).toBeNull();
    uploaded.push(path);
  });

  it("a student cannot upload into another user's folder", async () => {
    const c = await signInAs(EMAILS.student1);
    const path = `${IDS.users.s2}/avatar-intruder-${Date.now()}.png`;
    const { error } = await c.storage
      .from('avatars')
      .upload(path, png, { contentType: 'image/png' });
    expect(error).not.toBeNull();
  });

  it("an admin can upload into a counselor's folder", async () => {
    const c = await signInAs(EMAILS.admin);
    const path = `${IDS.users.counselor}/avatar-admin-${Date.now()}.png`;
    const { error } = await c.storage
      .from('avatars')
      .upload(path, png, { contentType: 'image/png' });
    expect(error).toBeNull();
    uploaded.push(path);
  });

  it('the object is publicly readable via its public URL', async () => {
    const c = await signInAs(EMAILS.student1);
    const url = c.storage.from('avatars').getPublicUrl(uploaded[0]!).data.publicUrl;
    const res = await fetch(url); // no auth headers on purpose
    expect(res.status).toBe(200);
  });

  it('a student can persist photo_url on their own row (not guard-restricted)', async () => {
    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c
      .from('students')
      .update({ photo_url: 'https://example.com/a.png' })
      .eq('id', IDS.students.s1)
      .select('photo_url');
    expect(error).toBeNull();
    expect(data?.[0]?.photo_url).toBe('https://example.com/a.png');
  });
});

describe('events: new display columns', () => {
  afterAll(async () => {
    // Restore the seeded values (dev seed sets venue/image/times on ev1).
    await serviceClient()
      .from('events')
      .update({
        location: 'Universidad Lorem Ipsum',
        image_url: 'https://picsum.photos/seed/wrsi-event/800/600.jpg',
        start_time: '09:00',
        end_time: '16:00',
      })
      .eq('id', IDS.event);
  });

  it('a student reads venue/image/times from the seeded event', async () => {
    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c
      .from('events')
      .select('location, image_url, start_time, end_time')
      .eq('id', IDS.event)
      .single();
    expect(error).toBeNull();
    expect(data?.location).toBe('Universidad Lorem Ipsum');
    expect(data?.image_url).toContain('picsum.photos');
    expect(data?.start_time).toBe('09:00:00');
    expect(data?.end_time).toBe('16:00:00');
  });

  it('an admin can update the new columns; a student cannot', async () => {
    const admin = await signInAs(EMAILS.admin);
    const upd = await admin
      .from('events')
      .update({ location: 'Centro Actualizado', start_time: '10:30' })
      .eq('id', IDS.event)
      .select('location, start_time');
    expect(upd.error).toBeNull();
    expect(upd.data?.[0]?.location).toBe('Centro Actualizado');
    expect(upd.data?.[0]?.start_time).toBe('10:30:00');

    const student = await signInAs(EMAILS.student1);
    const bad = await student
      .from('events')
      .update({ location: 'Hacked' })
      .eq('id', IDS.event)
      .select('id');
    expect(bad.error === null ? (bad.data ?? []).length : 0).toBe(0);
  });
});
