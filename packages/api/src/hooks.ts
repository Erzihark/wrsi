import { useQuery } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

/** Partner university directory (RLS: readable by all authenticated users). */
export function useUniversities() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.universities(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, description, logo_url, website')
        .order('name');
      if (error) throw error;
      return data;
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
