import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

/**
 * The student's latest lifecycle status, kept live: subscribes to Realtime changes
 * on status_history for this student and refetches when a counselor advances it.
 */
export function useStudentCurrentStatus(studentId: string | undefined) {
  const supabase = useSupabase();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.studentStatus(studentId ?? ''),
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_history')
        .select('id, changed_at, note, status:statuses(id, name, color, sort_order)')
        .eq('student_id', studentId as string)
        .order('changed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`status_history:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status_history',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.studentStatus(studentId) });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [studentId, supabase, qc]);

  return query;
}

/** Pending tasks for a student (RLS lets the student read their own). */
export function useStudentTasks(studentId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.studentTasks(studentId ?? ''),
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, status')
        .eq('student_id', studentId as string)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}
