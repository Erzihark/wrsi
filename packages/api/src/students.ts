import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type StudentDirectoryRow =
  Database['public']['Views']['student_directory']['Row'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

const PAGE_SIZE = 20;

export interface StudentFilters {
  search?: string;
  counselorId?: string | null;
  highSchoolId?: string | null;
  statusId?: string | null;
  graduationYear?: number | null;
  countryId?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
}

/**
 * Paginated ("load more"), filterable student list for the admin CRM. Reads from
 * `student_directory` (a security_invoker view), so RLS is inherited exactly as
 * if querying `students` directly.
 */
export function useStudentsList(filters: StudentFilters) {
  const supabase = useSupabase();
  return useInfiniteQuery({
    queryKey: [...queryKeys.lookup('students-directory'), filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('student_directory')
        .select('*', { count: 'exact' })
        .order('last_name', { ascending: true })
        .range(pageParam * PAGE_SIZE, pageParam * PAGE_SIZE + PAGE_SIZE - 1);

      // Strip characters that have meaning in a PostgREST or() filter so a stray
      // comma/paren can't malform the request (RLS still bounds the result).
      const search = filters.search?.trim().replace(/[(),*]/g, '');
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }
      if (filters.counselorId) query = query.eq('counselor_id', filters.counselorId);
      if (filters.highSchoolId) query = query.eq('high_school_id', filters.highSchoolId);
      if (filters.statusId) query = query.eq('status_id', filters.statusId);
      if (filters.graduationYear) {
        query = query.eq('expected_graduation_year', filters.graduationYear);
      }
      if (filters.countryId) query = query.eq('country_id', filters.countryId);
      if (filters.budgetMin != null) query = query.gte('budget', filters.budgetMin);
      if (filters.budgetMax != null) query = query.lte('budget', filters.budgetMax);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, total: count ?? 0, page: pageParam };
    },
    getNextPageParam: (last) =>
      (last.page + 1) * PAGE_SIZE < last.total ? last.page + 1 : undefined,
  });
}

/** A single student's full row (for the edit screen). RLS: self/assigned/admin. */
export function useStudent(studentId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.student(studentId ?? ''),
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Partial update to a student's profile. RLS + the students_guard_restricted_columns
 * trigger enforce who may change what (e.g. only an admin may reassign counselor_id) —
 * this hook just surfaces whatever error the server returns.
 */
export function useUpdateStudent(studentId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: StudentUpdate) => {
      const { data, error } = await supabase
        .from('students')
        .update(patch)
        .eq('id', studentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.student(studentId) });
      void qc.invalidateQueries({ queryKey: queryKeys.lookup('students-directory') });
    },
  });
}
