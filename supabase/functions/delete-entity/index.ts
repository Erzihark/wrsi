// Admin-only: delete a student / high school / university. We delete the backing
// auth user; the ON DELETE CASCADE on <table>.user_id removes the entity row and
// all of its children. Requires the service role (auth user deletion), so it can't
// live in the client.
import { corsHeaders, json } from '../_shared/cors.ts';
import { requireAdmin, serviceClient } from '../_shared/admin-guard.ts';
import { ENTITY_CONFIG, type EntityType } from '../_shared/entities.ts';

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
  const id = body.id as string | undefined;
  const config = ENTITY_CONFIG[entityType];
  if (!config) return json({ error: `Unknown entityType: ${entityType}` }, 400);
  if (!id) return json({ error: 'id is required' }, 400);

  const admin = serviceClient();
  const { data: row, error: rowErr } = await admin
    .from(config.table)
    .select('user_id')
    .eq('id', id)
    .single();
  if (rowErr || !row) return json({ error: rowErr?.message ?? 'Not found' }, 404);

  const { error: delErr } = await admin.auth.admin.deleteUser(row.user_id as string);
  if (delErr) return json({ error: delErr.message }, 400);

  return json({ ok: true });
});
