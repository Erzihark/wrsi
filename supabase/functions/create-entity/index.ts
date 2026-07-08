// Admin-only: provision a login-capable account for a student / high school /
// university and insert its profile row. The client cannot do this because
// creating an auth user requires the service role.
//
// Flow: verify caller is admin -> auth.admin.createUser (the on_auth_user_created
// trigger mirrors the user into public.users and grants the default 'student' role)
// -> for HS/university, swap that default for the correct portal role -> insert the
// entity row with user_id. If anything after user creation fails, the auth user is
// deleted so we never leak an orphan account.
import { corsHeaders, json } from '../_shared/cors.ts';
import { requireAdmin, serviceClient } from '../_shared/admin-guard.ts';
import { ENTITY_CONFIG, type EntityType, pickColumns } from '../_shared/entities.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const denied = await requireAdmin(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const entityType = body.entityType as EntityType;
  const email = body.email as string | undefined;
  const password = body.password as string | undefined;
  const profile = (body.profile as Record<string, unknown>) ?? {};

  const config = ENTITY_CONFIG[entityType];
  if (!config) return json({ error: `Unknown entityType: ${entityType}` }, 400);
  if (!email || typeof email !== 'string') {
    return json({ error: 'email is required' }, 400);
  }

  const admin = serviceClient();
  const tempPassword =
    typeof password === 'string' && password.length >= 6
      ? password
      : `${crypto.randomUUID().slice(0, 12)}A1!`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    return json({ error: createErr?.message ?? 'Failed to create user' }, 400);
  }
  const userId = created.user.id;

  try {
    if (config.role !== 'student') {
      // Replace the default 'student' grant from the signup trigger.
      await admin.from('user_roles').delete().eq('user_id', userId);
      const { data: role, error: roleErr } = await admin
        .from('roles')
        .select('id')
        .eq('name', config.role)
        .single();
      if (roleErr || !role) throw new Error(roleErr?.message ?? 'Role not found');
      const { error: urErr } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role_id: role.id });
      if (urErr) throw new Error(urErr.message);
    }

    const row = { user_id: userId, ...pickColumns(profile, config.columns) };
    const { data: inserted, error: insErr } = await admin
      .from(config.table)
      .insert(row)
      .select('id')
      .single();
    if (insErr) throw new Error(insErr.message);

    return json({ id: inserted.id, email, password: tempPassword }, 201);
  } catch (e) {
    // Roll back so a failed insert doesn't leave a login with no profile.
    await admin.auth.admin.deleteUser(userId);
    return json({ error: (e as Error).message }, 400);
  }
});
