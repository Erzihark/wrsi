import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

const ONE_HOUR = 60 * 60 * 1000;

/**
 * The language-exam catalog (IELTS / TOEFL / PTE / Cambridge / DELE), with the
 * language each belongs to. Reference data — readable by all authenticated
 * users, cached for an hour like the other lookups.
 */
export function useLanguageExams() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('language_exams'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('language_exams')
        .select('id, name, languages(name)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export interface SaveLanguageExamInput {
  studentId: string;
  languageExamId: string;
  /** IELTS/PTE use decimals; the column is numeric(4,1). */
  score?: number | null;
  examDate?: string | null;
  expiryDate?: string | null;
}

/**
 * The student's recorded exam results — the profile screen's "Nivel de inglés"
 * row ("Avanzado (C1) – IELTS 7.0"): the CEFR band lives on `students`, the
 * exam and score here. RLS scopes reads to the student's own rows.
 */
export function useMyLanguageExams() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myLanguageExams,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_language_exams')
        .select('student_id, language_exam_id, score, exam_date, expiry_date, language_exams(id, name)');
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Upsert one exam result. The table is keyed by (student_id, language_exam_id),
 * so re-saving the same exam updates the score rather than duplicating it.
 */
export function useSaveMyLanguageExam() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveLanguageExamInput) => {
      const { error } = await supabase.from('student_language_exams').upsert(
        {
          student_id: input.studentId,
          language_exam_id: input.languageExamId,
          score: input.score ?? null,
          exam_date: input.examDate ?? null,
          expiry_date: input.expiryDate ?? null,
        },
        { onConflict: 'student_id,language_exam_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myLanguageExams });
    },
  });
}

export function useDeleteMyLanguageExam() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { studentId: string; languageExamId: string }) => {
      const { error } = await supabase
        .from('student_language_exams')
        .delete()
        .eq('student_id', input.studentId)
        .eq('language_exam_id', input.languageExamId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myLanguageExams });
    },
  });
}
