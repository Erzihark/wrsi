import {
  createClient,
  type SupabaseClient,
  type SupportedStorage,
} from '@supabase/supabase-js';
import type { Database } from '@wrsi/shared-types';

/** Supabase client typed against the WRSI database schema. */
export type WrsiClient = SupabaseClient<Database>;

export interface CreateClientOptions {
  url: string;
  anonKey: string;
  /**
   * Platform storage adapter for the auth session.
   * On mobile, pass an expo-secure-store-backed adapter; omit for in-memory.
   */
  storage?: SupportedStorage;
  /** Detect the session from a URL (web only; false on native). */
  detectSessionInUrl?: boolean;
}

export function createWrsiClient({
  url,
  anonKey,
  storage,
  detectSessionInUrl = false,
}: CreateClientOptions): WrsiClient {
  return createClient<Database>(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl,
    },
  });
}
