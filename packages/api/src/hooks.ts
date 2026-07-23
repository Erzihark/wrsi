import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sanitizeSearchTerm } from '@wrsi/shared-utils';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

/** Partner university directory (RLS: readable by all authenticated users). */
export function useUniversities(search?: string) {
  const supabase = useSupabase();
  // Strip PostgREST filter metacharacters so a stray token can't malform the query.
  const term = sanitizeSearchTerm(search);
  return useQuery({
    queryKey: queryKeys.universities({ search: term }),
    queryFn: async () => {
      let query = supabase
        .from('universities')
        .select('id, name, description, logo_url, website')
        .order('name');
      if (term) query = query.ilike('name', `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/** Programs offered by a university (level + field labels for display). */
export function useUniversityPrograms(universityId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.universityPrograms(universityId ?? ''),
    enabled: Boolean(universityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('university_programs')
        .select(
          'id, name, duration, tuition, tuition_currency_id, education_levels(name), fields_of_study(name)',
        )
        .eq('university_id', universityId as string)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** ☆ Interesada (considering) vs ★ Favorita (in the student's ranked top). */
export type InterestLevel = 'interested' | 'favorite';

export interface UniversityInterestRow {
  university_id: string;
  interest_level: InterestLevel;
  rank: number | null;
  created_at: string;
}

/**
 * The signed-in student's saved universities, with their level (Interesada /
 * Favorita) and position in the personal ranking. RLS returns only the
 * student's own rows, so no student_id filter is needed.
 *
 * Returns both the array (for the ranked "Mis universidades" list) and a Map
 * (for O(1) lookups while rendering a directory). Building the Map here rather
 * than per-render means it is computed once per fetch and shared by every
 * consumer of the cache entry. `has()` is preserved on `byId` so the older
 * `interests.data?.has(id)` call shape keeps working.
 */
export function useMyUniversityInterests() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.universityInterests,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_university_interest')
        .select('university_id, interest_level, rank, created_at');
      if (error) throw error;
      const rows = (data ?? []) as UniversityInterestRow[];
      return { rows, byId: new Map(rows.map((r) => [r.university_id, r])) };
    },
  });
}

/**
 * Set (or clear) the student's interest in a university.
 *
 * `level: null` removes the row entirely — the ☆/★ control cycles
 * none → interesada → favorita → none. A new favorite is appended to the end of
 * the ranking rather than inserted at the top, so marking one doesn't silently
 * demote everything the student already ordered; `nextRank` is the caller's
 * current max + 1.
 *
 * Inserting fires the existing admin-notification trigger.
 */
export function useSetUniversityInterest() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      universityId,
      level,
      nextRank,
    }: {
      studentId: string;
      universityId: string;
      level: InterestLevel | null;
      nextRank?: number;
    }) => {
      if (level === null) {
        const { error } = await supabase
          .from('student_university_interest')
          .delete()
          .eq('student_id', studentId)
          .eq('university_id', universityId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('student_university_interest').upsert(
        {
          student_id: studentId,
          university_id: universityId,
          interest_level: level,
          // Only favorites hold a position; demoting to Interesada releases it.
          rank: level === 'favorite' ? nextRank ?? null : null,
        },
        { onConflict: 'student_id,university_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.universityInterests });
    },
  });
}

/**
 * Persist a reordered ranking. Takes the rows whose position actually changed
 * (see `renumberRanks` in `@wrsi/shared-utils`) and writes them in one upsert,
 * which is why `rank` carries no unique constraint — the intermediate state of
 * a reorder necessarily has duplicates.
 */
export function useReorderFavoriteUniversities() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      ranks,
    }: {
      studentId: string;
      ranks: { university_id: string; rank: number }[];
    }) => {
      if (ranks.length === 0) return;
      const { error } = await supabase.from('student_university_interest').upsert(
        ranks.map((r) => ({
          student_id: studentId,
          university_id: r.university_id,
          interest_level: 'favorite',
          rank: r.rank,
        })),
        { onConflict: 'student_id,university_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.universityInterests });
    },
  });
}

/** The signed-in student's own profile (RLS returns only their row). */
export function useMyStudentProfile() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myStudent,
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Unread + read notifications for the signed-in user, newest first. */
export function useNotifications() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Unread-notification count for the header bell badge. A `head: true` count
 * query (no rows transferred), served by the partial unread index. Refreshed
 * by the mark-read mutations; RLS scopes it to the signed-in user.
 */
export function useUnreadNotificationsCount() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Mark one of the signed-in user's notifications read (RLS: owner update only). */
export function useMarkNotificationRead() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      // `notifications` is a prefix of `notificationsUnread`, so this refreshes both.
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

/** Mark all of the signed-in user's unread notifications read. */
export function useMarkAllNotificationsRead() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

/**
 * The signed-in student's assigned counselor (or null when unassigned), for the
 * dashboard counselor card + Consejero tab. Reads the student's own row (RLS:
 * self) with the counselor embedded via students.counselor_id; counselor rows
 * are readable by all authenticated users. `phone` doubles as the WhatsApp
 * number for the "Abrir chat" deep link.
 */
export function useMyCounselor() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myCounselor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('counselor:counselors(id, first_name, last_name, phone, photo_url)')
        .maybeSingle();
      if (error) throw error;
      return data?.counselor ?? null;
    },
  });
}
