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

// The admin app validates email/links format client-side (zod), but that's not
// a security boundary a direct write can't bypass — these CHECK constraints
// (migration 20260722000001) are the backend half of that guard. Even the
// admin's own service-role-bypassing path must go through the app's RLS-bound
// client, so this exercises the constraint the way a real write would hit it.
describe('sponsors_and_allies: email/links format is enforced at the DB layer', () => {
  let sponsorId: string | undefined;

  afterAll(async () => {
    if (sponsorId) {
      await serviceClient().from('sponsors_and_allies').delete().eq('id', sponsorId);
    }
  });

  it('rejects a malformed email on insert and update', async () => {
    const admin = await signInAs(EMAILS.admin);

    const badInsert = await admin
      .from('sponsors_and_allies')
      .insert({ name: `Bad Email Sponsor ${Date.now()}`, email: 'not-an-email' })
      .select();
    expect(badInsert.error).not.toBeNull();
    expect(badInsert.error?.message ?? '').toMatch(/sponsors_and_allies_email_format_check/);

    const created = await admin
      .from('sponsors_and_allies')
      .insert({ name: `Good Sponsor ${Date.now()}` })
      .select('id')
      .single();
    expect(created.error).toBeNull();
    sponsorId = created.data?.id;

    const badUpdate = await admin
      .from('sponsors_and_allies')
      .update({ email: 'still not an email' })
      .eq('id', sponsorId as string)
      .select();
    expect(badUpdate.error).not.toBeNull();
    expect(badUpdate.error?.message ?? '').toMatch(/sponsors_and_allies_email_format_check/);
  });

  it('rejects a malformed link on insert and update, and accepts a well-formed one', async () => {
    const admin = await signInAs(EMAILS.admin);

    const badInsert = await admin
      .from('sponsors_and_allies')
      .insert({ name: `Bad Link Sponsor ${Date.now()}`, links: 'not a url' })
      .select();
    expect(badInsert.error).not.toBeNull();
    expect(badInsert.error?.message ?? '').toMatch(/sponsors_and_allies_links_format_check/);

    const goodUpdate = await admin
      .from('sponsors_and_allies')
      .update({ links: 'https://example.com/partner' })
      .eq('id', sponsorId as string)
      .select('links')
      .single();
    expect(goodUpdate.error).toBeNull();
    expect(goodUpdate.data?.links).toBe('https://example.com/partner');

    const badUpdate = await admin
      .from('sponsors_and_allies')
      .update({ links: 'ftp://example.com' })
      .eq('id', sponsorId as string)
      .select();
    expect(badUpdate.error).not.toBeNull();
    expect(badUpdate.error?.message ?? '').toMatch(/sponsors_and_allies_links_format_check/);
  });

  it('allows null/absent email and links', async () => {
    const admin = await signInAs(EMAILS.admin);
    const created = await admin
      .from('sponsors_and_allies')
      .insert({ name: `No Contact Sponsor ${Date.now()}` })
      .select('id, email, links')
      .single();
    expect(created.error).toBeNull();
    expect(created.data?.email).toBeNull();
    expect(created.data?.links).toBeNull();
    await serviceClient().from('sponsors_and_allies').delete().eq('id', created.data?.id as string);
  });
});

// Covers useSponsorsList's status_id/industry_id filters (SponsorsListScreen's
// filter panel), on top of the name search already covered above.
describe('sponsors_and_allies: status/industry filters (useSponsorsList)', () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length) {
      await serviceClient().from('sponsors_and_allies').delete().in('id', createdIds);
    }
  });

  it('filters by status_id and by industry_id independently, and combined with search', async () => {
    const admin = await signInAs(EMAILS.admin);

    // Real seeded lookup rows — ids aren't fixed constants like tests/backend/helpers/ids.ts,
    // so fetch two distinct ones of each to build an unambiguous fixture.
    const [statusesRes, industriesRes] = await Promise.all([
      admin.from('statuses').select('id, name').eq('entity_type', 'sponsor').order('sort_order'),
      admin.from('industries').select('id, name').order('name'),
    ]);
    expect(statusesRes.error).toBeNull();
    expect(industriesRes.error).toBeNull();
    const statusList = statusesRes.data ?? [];
    const industryList = industriesRes.data ?? [];
    expect(statusList.length).toBeGreaterThanOrEqual(2);
    expect(industryList.length).toBeGreaterThanOrEqual(2);
    const statusA = statusList[0] as (typeof statusList)[number];
    const statusB = statusList[1] as (typeof statusList)[number];
    const industryA = industryList[0] as (typeof industryList)[number];
    const industryB = industryList[1] as (typeof industryList)[number];

    const stamp = Date.now();
    const nameA = `Filter Sponsor A ${stamp}`;
    const nameB = `Filter Sponsor B ${stamp}`;

    const [createdA, createdB] = await Promise.all([
      admin
        .from('sponsors_and_allies')
        .insert({ name: nameA, status_id: statusA.id, industry_id: industryA.id })
        .select('id')
        .single(),
      admin
        .from('sponsors_and_allies')
        .insert({ name: nameB, status_id: statusB.id, industry_id: industryB.id })
        .select('id')
        .single(),
    ]);
    expect(createdA.error).toBeNull();
    expect(createdB.error).toBeNull();
    createdIds.push(createdA.data?.id as string, createdB.data?.id as string);

    // Filter by status_id: only the matching row comes back.
    const byStatus = await admin
      .from('sponsors_and_allies')
      .select('id')
      .eq('status_id', statusA.id)
      .in('id', createdIds);
    expect(byStatus.error).toBeNull();
    expect((byStatus.data ?? []).map((r) => r.id)).toEqual([createdA.data?.id]);

    // Filter by industry_id: only the matching row comes back.
    const byIndustry = await admin
      .from('sponsors_and_allies')
      .select('id')
      .eq('industry_id', industryB.id)
      .in('id', createdIds);
    expect(byIndustry.error).toBeNull();
    expect((byIndustry.data ?? []).map((r) => r.id)).toEqual([createdB.data?.id]);

    // Combined with the name search (ilike), mirroring useSponsorsList's query shape.
    const combined = await admin
      .from('sponsors_and_allies')
      .select('id')
      .ilike('name', `%Filter Sponsor%${stamp}%`)
      .eq('status_id', statusA.id)
      .eq('industry_id', industryA.id);
    expect(combined.error).toBeNull();
    expect((combined.data ?? []).map((r) => r.id)).toEqual([createdA.data?.id]);

    // A status/industry combo that matches neither row returns nothing.
    const noMatch = await admin
      .from('sponsors_and_allies')
      .select('id')
      .eq('status_id', statusA.id)
      .eq('industry_id', industryB.id)
      .in('id', createdIds);
    expect(noMatch.error).toBeNull();
    expect(noMatch.data ?? []).toEqual([]);
  });
});
