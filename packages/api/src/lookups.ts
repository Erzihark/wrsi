import { useQuery } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

const ONE_HOUR = 1000 * 60 * 60;

export function useCountries() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('countries'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, name_es, iso_code, calling_code')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useFieldsOfStudy() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('fields_of_study'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fields_of_study')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useEducationLevels() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('education_levels'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_levels')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useFinancialPlans() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('financial_plans'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_plans')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCurrencies() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('currencies'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('id, name, code, symbol')
        .order('code');
      if (error) throw error;
      return data;
    },
  });
}

/** Ordered student-lifecycle statuses (for the dashboard progress timeline). */
export function useStudentStatuses() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('student_statuses'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statuses')
        .select('id, name, color, sort_order, is_terminal')
        .eq('entity_type', 'student')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}
