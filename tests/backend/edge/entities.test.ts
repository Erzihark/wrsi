import { describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { ANON_KEY, SUPABASE_URL } from '../helpers/env';
import { EMAILS } from '../helpers/ids';

// These exercise the create-entity / delete-entity Edge Functions, so they need
// `yarn supabase functions serve` running alongside the local stack.

describe('create-entity Edge Function: authorization', () => {
  it('rejects a request with no Authorization header (verify_jwt)', async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-entity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({
        entityType: 'high_school',
        email: 'nope@wrsi.test',
        profile: { name: 'Nope' },
      }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin caller', async () => {
    const student = await signInAs(EMAILS.student1);
    const { error } = await student.functions.invoke('create-entity', {
      body: {
        entityType: 'high_school',
        email: 'nope2@wrsi.test',
        profile: { name: 'Nope' },
      },
    });
    expect(error).not.toBeNull();
  });
});

describe('create-entity / delete-entity Edge Function: admin happy path', () => {
  it('creates a high school with the high_school role, then cascade-deletes it', async () => {
    const admin = await signInAs(EMAILS.admin);
    const email = `hs-${Date.now()}@wrsi.test`;

    const created = await admin.functions.invoke<{
      id: string;
      email: string;
      password: string;
    }>('create-entity', {
      body: { entityType: 'high_school', email, profile: { name: `Test HS ${Date.now()}` } },
    });
    expect(created.error).toBeNull();
    const entityId = created.data?.id;
    expect(entityId).toBeTruthy();

    // The provisioned account must carry the high_school role, not the default student.
    const svc = serviceClient();
    const hs = await svc
      .from('high_schools')
      .select('user_id')
      .eq('id', entityId as string)
      .single();
    expect(hs.error).toBeNull();
    const roleRows = await svc
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', hs.data!.user_id as string);
    const roleNames = (roleRows.data ?? []).map(
      (r) => (r as { roles: { name: string } | null }).roles?.name,
    );
    expect(roleNames).toContain('high_school');
    expect(roleNames).not.toContain('student');

    // Delete removes the backing auth user; ON DELETE CASCADE drops the row.
    const del = await admin.functions.invoke('delete-entity', {
      body: { entityType: 'high_school', id: entityId },
    });
    expect(del.error).toBeNull();

    const gone = await svc.from('high_schools').select('id').eq('id', entityId as string);
    expect((gone.data ?? []).length).toBe(0);
  });

  it('returns an error when creating with a duplicate email', async () => {
    const admin = await signInAs(EMAILS.admin);
    const dup = await admin.functions.invoke('create-entity', {
      body: {
        entityType: 'high_school',
        email: EMAILS.highschool1, // already seeded
        profile: { name: 'Duplicate' },
      },
    });
    expect(dup.error).not.toBeNull();
  });
});
