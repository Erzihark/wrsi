import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type HighSchoolRow = Database['public']['Tables']['high_schools']['Row'];
export type HighSchoolUpdate = Database['public']['Tables']['high_schools']['Update'];
export type UniversityRow = Database['public']['Tables']['universities']['Row'];
export type UniversityUpdate = Database['public']['Tables']['universities']['Update'];

// Strip characters meaningful to a PostgREST filter so a stray token can't
// malform the request (RLS still bounds the result). Mirrors students.ts.
const sanitize = (search?: string) => search?.trim().replace(/[(),*]/g, '');

/** High schools list for the admin CRM (name search, ordered by name). */
export function useHighSchoolsList(search?: string) {
  const supabase = useSupabase();
  const term = sanitize(search);
  return useQuery({
    queryKey: [...queryKeys.highSchools(), term ?? ''],
    queryFn: async () => {
      let query = supabase
        .from('high_schools')
        .select('id, name, contact_first_name, contact_last_name, phone_number')
        .order('name');
      if (term) query = query.ilike('name', `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/** A single high school's full row (for the edit screen). */
export function useHighSchool(id: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.highSchool(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('high_schools')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** Partial update to a high school. RLS enforces admin-only. */
export function useUpdateHighSchool(id: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: HighSchoolUpdate) => {
      const { data, error } = await supabase
        .from('high_schools')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.highSchool(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.highSchools() });
    },
  });
}

/** Universities list for the admin CRM (name search, ordered by name). */
export function useUniversitiesList(search?: string) {
  const supabase = useSupabase();
  const term = sanitize(search);
  return useQuery({
    queryKey: [...queryKeys.universities(), term ?? ''],
    queryFn: async () => {
      let query = supabase
        .from('universities')
        .select('id, name, website')
        .order('name');
      if (term) query = query.ilike('name', `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/** A single university's full row (for the edit screen). */
export function useUniversity(id: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.university(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** Partial update to a university. RLS enforces admin-only. */
export function useUpdateUniversity(id: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: UniversityUpdate) => {
      const { data, error } = await supabase
        .from('universities')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.university(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.universities() });
    },
  });
}
