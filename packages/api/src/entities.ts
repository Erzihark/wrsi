import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

/** The admin-managed, login-backed entity types. */
export type EntityType = 'student' | 'high_school' | 'university' | 'counselor';

export interface CreateEntityArgs {
  email: string;
  /** Optional; the function generates a temp password when omitted. */
  password?: string;
  /** Entity-specific profile columns (server whitelists them). */
  profile: Record<string, unknown>;
}

export interface CreateEntityResult {
  id: string;
  email: string;
  /** The password to hand to the account owner (generated if not supplied). */
  password: string;
}

/** Which list cache to refresh after a create/delete of a given entity type. */
export function listKey(entityType: EntityType) {
  switch (entityType) {
    case 'student':
      return queryKeys.lookup('students-directory');
    case 'high_school':
      return queryKeys.highSchools();
    case 'university':
      return queryKeys.universities();
    case 'counselor':
      return queryKeys.lookup('counselors');
  }
}

/**
 * Supabase Edge Functions return a non-2xx body inside `error.context` (a
 * Response), not on `error.message` — pull the server's `{ error }` out so the UI
 * shows "email already registered" instead of a generic "non-2xx status code".
 */
export async function functionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = (await ctx.json()) as { error?: string };
      if (body?.error) return body.error;
    } catch {
      // fall through to the generic message
    }
  }
  return (error as Error)?.message ?? fallback;
}

/**
 * Create a login-capable student / high school / university via the
 * `create-entity` Edge Function (service role: creates the auth user + role +
 * profile row). Admin-only, enforced server-side.
 */
export function useCreateEntity(entityType: EntityType) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: CreateEntityArgs): Promise<CreateEntityResult> => {
      const { data, error } = await supabase.functions.invoke<CreateEntityResult>(
        'create-entity',
        { body: { entityType, ...args } },
      );
      if (error) throw new Error(await functionErrorMessage(error, 'Create failed'));
      return data as CreateEntityResult;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: listKey(entityType) });
    },
  });
}

/**
 * Delete a student / high school / university via the `delete-entity` Edge
 * Function (deletes the backing auth user; ON DELETE CASCADE removes the row).
 */
export function useDeleteEntity(entityType: EntityType) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('delete-entity', {
        body: { entityType, id },
      });
      if (error) throw new Error(await functionErrorMessage(error, 'Delete failed'));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: listKey(entityType) });
    },
  });
}
