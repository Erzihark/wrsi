// Auth helpers shared by the admin-only entity Edge Functions.
//
// The platform verifies the caller's JWT before the function runs (verify_jwt),
// but that only proves *some* signed-in user — we still must confirm they are an
// admin/super-admin. We do that by calling the same `is_admin()` SQL predicate the
// RLS policies use, through a client scoped to the caller's Authorization header,
// so the check is identical to what the database itself would enforce.
import {
  createClient,
  type SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';
import { json } from './cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Service-role client: bypasses RLS. Never expose this to the browser. */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Returns `null` when the caller is an admin, or a ready-to-return `Response`
 * (401/403/500) otherwise — so callers can `if (denied) return denied;`.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const caller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await caller.rpc('is_admin');
  if (error) return json({ error: error.message }, 500);
  if (data !== true) return json({ error: 'Forbidden: admin only' }, 403);
  return null;
}
