import { useQuery } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

/**
 * The signed-in student's university applications, newest first, for the
 * "Mis aplicaciones" screen. Read-only from the app: applications are
 * created/advanced by staff. RLS (`can_access_student`) returns only the
 * student's own rows for a student session.
 *
 * The embeds each serve one part of the designed card:
 * - `status` — the badge, and (with `is_terminal`) which timeline milestone the
 *   application currently sits on.
 * - `university` — logo, name, and the "State, Country" line via the
 *   `state_province → country` chain.
 * - `program` — the degree chip; null until staff pick one.
 * - `history` — `application_status_history`, which is where the per-milestone
 *   dates on the tracker come from. Readable by the student under the same
 *   `can_access_student` policy as the application itself.
 */
export function useMyApplications() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_applications')
        .select(
          `id, intake_year, intake_term, created_at, updated_at,
           status:statuses(id, name, color, sort_order, is_terminal),
           university:universities(
             id, name, logo_url,
             state_province:states_provinces(name, country:countries(name, name_es))
           ),
           program:university_programs(id, name),
           history:application_status_history(
             changed_at, status:statuses(name, is_terminal)
           )`,
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
