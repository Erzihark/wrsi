import { useQuery } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

/**
 * The signed-in student's university applications, newest first, with the
 * current application status (catalog name/color) and university identity
 * embedded for the "My Apps" screen. Read-only from the app: applications are
 * created/advanced by staff. RLS (`can_access_student`) returns only the
 * student's own rows for a student session.
 */
export function useMyApplications() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_applications')
        .select(
          'id, intake_year, intake_term, created_at, status:statuses(id, name, color, sort_order), university:universities(id, name, logo_url)',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
