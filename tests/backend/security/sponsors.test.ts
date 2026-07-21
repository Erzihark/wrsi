import { afterAll, describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { EMAILS } from '../helpers/ids';

// General read/write RLS denial for non-admins is already covered by
// rls.test.ts ("RLS: admin-only tables are invisible to non-admins"). This file
// covers the full admin CRUD surface (create/update/delete/search) that hooks
// in packages/api/src/sponsors.ts exercise, mirroring events.test.ts's shape.
describe('sponsors_and_allies: admin-only CRUD (useSponsorsList/useCreateSponsor/useUpdateSponsor/useDeleteSponsor)', () => {
  let createdSponsorId: string | undefined;

  afterAll(async () => {
    if (createdSponsorId) {
      await serviceClient().from('sponsors_and_allies').delete().eq('id', createdSponsorId);
    }
  });

  it('a student cannot create, update, or delete a sponsor/ally', async () => {
    const svc = serviceClient();
    const seeded = await svc
      .from('sponsors_and_allies')
      .insert({ name: `Seeded Sponsor ${Date.now()}` })
      .select('id')
      .single();
    expect(seeded.error).toBeNull();
    const seededId = seeded.data?.id as string;

    const student = await signInAs(EMAILS.student1);

    const ins = await student
      .from('sponsors_and_allies')
      .insert({ name: 'Student-forged sponsor' })
      .select();
    expect(ins.error).not.toBeNull();

    const upd = await student
      .from('sponsors_and_allies')
      .update({ name: 'Hijacked name' })
      .eq('id', seededId)
      .select();
    expect(upd.error).toBeNull();
    expect((upd.data ?? []).length).toBe(0); // filtered out by RLS, not raised

    const del = await student.from('sponsors_and_allies').delete().eq('id', seededId).select();
    expect(del.error).toBeNull();
    expect((del.data ?? []).length).toBe(0);

    await svc.from('sponsors_and_allies').delete().eq('id', seededId);
  });

  it('an admin can create, search, update, and delete a sponsor/ally', async () => {
    const admin = await signInAs(EMAILS.admin);
    const uniqueName = `Admin Test Sponsor ${Date.now()}`;

    const created = await admin
      .from('sponsors_and_allies')
      .insert({ name: uniqueName, email: 'sponsor@example.com' })
      .select('id, name')
      .single();
    expect(created.error).toBeNull();
    createdSponsorId = created.data?.id;

    const found = await admin
      .from('sponsors_and_allies')
      .select('id')
      .ilike('name', `%${uniqueName}%`);
    expect(found.error).toBeNull();
    expect((found.data ?? []).map((r) => r.id)).toContain(createdSponsorId);

    const updated = await admin
      .from('sponsors_and_allies')
      .update({ name: 'Renamed by admin' })
      .eq('id', createdSponsorId as string)
      .select('name')
      .single();
    expect(updated.error).toBeNull();
    expect(updated.data?.name).toBe('Renamed by admin');

    const deleted = await admin
      .from('sponsors_and_allies')
      .delete()
      .eq('id', createdSponsorId as string)
      .select();
    expect(deleted.error).toBeNull();
    expect((deleted.data ?? []).length).toBe(1);
    createdSponsorId = undefined;
  });
});
