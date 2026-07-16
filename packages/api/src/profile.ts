import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type UpdateStudentProfileArgs =
  Database['public']['Functions']['update_student_profile']['Args'];

/**
 * Atomically update the signed-in student's profile + interest join rows via
 * the `update_student_profile` RPC. Unlike `complete_student_onboarding` this
 * never touches the lifecycle status or `onboarding_completed_at`, so it is
 * safe for post-onboarding profile edits.
 */
export function useUpdateMyStudentProfile() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: UpdateStudentProfileArgs) => {
      const { data, error } = await supabase.rpc('update_student_profile', args);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myStudent });
      void qc.invalidateQueries({ queryKey: queryKeys.myInterestSelections });
    },
  });
}

export interface StudentInterestSelections {
  passportCountryIds: string[];
  countryInterestIds: string[];
  fieldIds: string[];
  intendedLevelIds: string[];
}

/**
 * The signed-in student's interest selections (passports, destination
 * countries, fields of study, intended levels) for prefilling the profile
 * edit form. RLS (`can_access_student`) scopes each join table to the
 * student's own rows, so no student_id filter is needed.
 */
export function useMyStudentInterestSelections(studentId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myInterestSelections,
    enabled: Boolean(studentId),
    queryFn: async (): Promise<StudentInterestSelections> => {
      const [passports, countries, fields, levels] = await Promise.all([
        supabase.from('student_passports').select('country_id'),
        supabase.from('student_countries_interest').select('country_id'),
        supabase.from('student_fields_of_study_interest').select('field_of_study_id'),
        supabase.from('student_education_level_interest').select('education_level_id'),
      ]);
      for (const res of [passports, countries, fields, levels]) {
        if (res.error) throw res.error;
      }
      return {
        passportCountryIds: (passports.data ?? []).map((r) => r.country_id),
        countryInterestIds: (countries.data ?? []).map((r) => r.country_id),
        fieldIds: (fields.data ?? []).map((r) => r.field_of_study_id),
        intendedLevelIds: (levels.data ?? []).map((r) => r.education_level_id),
      };
    },
  });
}
