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

export function useStatesProvinces() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('states_provinces'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states_provinces')
        .select('id, name, country_id')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useEducationModels() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('education_models'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_models')
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

/** Industries, for the sponsors/allies directory's "industry" field. */
export function useIndustries() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('industries'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industries')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** Counselors, for the CRM's "assigned counselor" filter/field. */
export function useCounselors() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('counselors'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counselors')
        .select('id, first_name, last_name')
        .order('first_name');
      if (error) throw error;
      return data;
    },
  });
}

/**
 * High schools (prepas), for the CRM's "high school" filter/field. Shares the
 * `highSchools()` key base with the admin list/create/update/delete hooks in
 * directory.ts + entities.ts so writes there also refresh this dropdown
 * (mirrors the `lookup('counselors')` sharing below).
 */
export function useHighSchools() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.highSchools(),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('high_schools')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** Ordered statuses for any entity type (student, high_school, university…). */
export function useStatuses(entityType: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup(`statuses-${entityType}`),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statuses')
        .select('id, name, color, sort_order, is_terminal')
        .eq('entity_type', entityType)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

/** Ordered student-lifecycle statuses (for the dashboard progress timeline). */
export function useStudentStatuses() {
  return useStatuses('student');
}
