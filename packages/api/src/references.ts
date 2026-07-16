import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type StudentReference = Tables<'student_references'>;

export interface SaveReferenceInput {
  /** Omit to create; supply to update an existing row. */
  id?: string;
  studentId: string;
  fullName: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * The signed-in student's reference contacts — the profile screen's "Personas
 * extra (Referencias / Recomendaciones)". RLS (`can_access_student`) scopes the
 * read to the student's own rows, so no client-side filter is needed.
 */
export function useMyReferences() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myReferences,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_references')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create or update one reference. Writes go through the table (not the profile
 * RPC) because references are 0..N rows with their own fields — a uuid[] replace
 * like the interest join tables wouldn't carry them.
 */
export function useSaveReference() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveReferenceInput) => {
      const row = {
        student_id: input.studentId,
        full_name: input.fullName.trim(),
        relationship: input.relationship?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
      };
      const query = input.id
        ? supabase.from('student_references').update(row).eq('id', input.id)
        : supabase.from('student_references').insert(row);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myReferences });
    },
  });
}

export function useDeleteReference() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('student_references').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myReferences });
    },
  });
}
