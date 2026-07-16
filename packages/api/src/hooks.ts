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

/**
 * The set of university ids the signed-in student has saved. RLS returns only
 * the student's own interest rows, so no student_id filter is needed.
 */
export function useMyUniversityInterests() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.universityInterests,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_university_interest')
        .select('university_id');
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.university_id));
    },
  });
}

/**
 * Save/unsave a university for the current student. Inserting fires the
 * admin-notification trigger (already wired in the schema). `saved` is the
 * current state — true means "currently saved" → this call removes it.
 */
export function useToggleUniversityInterest() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      universityId,
      saved,
    }: {
      studentId: string;
      universityId: string;
      saved: boolean;
    }) => {
      if (saved) {
        const { error } = await supabase
          .from('student_university_interest')
          .delete()
          .eq('student_id', studentId)
          .eq('university_id', universityId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_university_interest')
          .insert({ student_id: studentId, university_id: universityId });
        if (error) throw error;
      }
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
