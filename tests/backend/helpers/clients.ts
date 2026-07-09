import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@wrsi/shared-types';
import { ANON_KEY, SERVICE_ROLE_KEY, SUPABASE_URL } from './env';
import { PASSWORD } from './ids';

export type DbClient = SupabaseClient<Database>;

// Mirrors @wrsi/api's createWrsiClient auth config, but built directly here so
// the Node test process doesn't import the React-flavored @wrsi/api barrel.
function makeClient(key: string): DbClient {
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Anonymous client (anon key, no user session). */
export function anonClient(): DbClient {
  return makeClient(ANON_KEY);
}

/** Service-role client — bypasses RLS. Use only for fixture setup/teardown and
 *  ground-truth assertions, never as the subject under test. */
export function serviceClient(): DbClient {
  return makeClient(SERVICE_ROLE_KEY);
}

/** A client authenticated as the given seeded account. */
export async function signInAs(
  email: string,
  password: string = PASSWORD,
): Promise<DbClient> {
  const client = makeClient(ANON_KEY);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`sign-in failed for ${email}: ${error.message}`);
  }
  return client;
}
