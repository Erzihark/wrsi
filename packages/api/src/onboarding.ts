import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type CompleteOnboardingArgs =
  Database['public']['Functions']['complete_student_onboarding']['Args'];

/** Atomically writes the student's onboarding profile + interests via the RPC. */
export function useCompleteOnboarding() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: CompleteOnboardingArgs) => {
      const { data, error } = await supabase.rpc('complete_student_onboarding', args);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myStudent });
    },
  });
}
