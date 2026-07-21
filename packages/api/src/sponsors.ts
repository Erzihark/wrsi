import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type SponsorRow = Database['public']['Tables']['sponsors_and_allies']['Row'];
export type SponsorInsert = Database['public']['Tables']['sponsors_and_allies']['Insert'];
export type SponsorUpdate = Database['public']['Tables']['sponsors_and_allies']['Update'];

// Strip characters meaningful to a PostgREST filter so a stray token can't
// malform the request (RLS still bounds the result). Mirrors events.ts/directory.ts.
const sanitize = (search?: string) => search?.trim().replace(/[(),*]/g, '');

/** Sponsors/allies list for the admin directory (name search, ordered by name). */
export function useSponsorsList(search?: string) {
  const supabase = useSupabase();
  const term = sanitize(search);
  return useQuery({
    queryKey: [...queryKeys.sponsors, 'list', term ?? ''],
    queryFn: async () => {
      let query = supabase
        .from('sponsors_and_allies')
        .select('id, name, email, industries(name), statuses(name, color)')
        .order('name');
      if (term) query = query.ilike('name', `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/** A single sponsor/ally's full row (for the edit screen). */
export function useSponsor(id: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.sponsor(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors_and_allies')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** Create a sponsor/ally. RLS enforces admin-only. Not login-backed — a plain table write. */
export function useCreateSponsor() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SponsorInsert) => {
      const { data, error } = await supabase
        .from('sponsors_and_allies')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sponsors });
    },
  });
}

/** Partial update to a sponsor/ally. RLS enforces admin-only. */
export function useUpdateSponsor(id: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: SponsorUpdate) => {
      const { data, error } = await supabase
        .from('sponsors_and_allies')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sponsor(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.sponsors });
    },
  });
}

/** Delete a sponsor/ally. RLS enforces admin-only. */
export function useDeleteSponsor() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sponsors_and_allies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sponsors });
    },
  });
}
