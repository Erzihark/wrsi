import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventNoteRow = Database['public']['Tables']['event_notes']['Row'];

/** All WX events (fairs, Open Fair Day, ...), soonest first. RLS: readable by all authenticated users. */
export function useEvents() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('start_date');
      if (error) throw error;
      return data;
    },
  });
}

/** A single event's full row (for the detail screen). */
export function useEvent(id: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.event(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** Universities participating in an event. */
export function useEventUniversities(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.eventUniversities(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_universities')
        .select('universities(id, name, logo_url)')
        .eq('event_id', eventId as string);
      if (error) throw error;
      return data.map((r) => r.universities).filter((u): u is NonNullable<typeof u> => Boolean(u));
    },
  });
}

/** Workshop schedule for an event, earliest first. */
export function useEventWorkshops(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.eventWorkshops(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('id, title, start_time, end_time, universities(name)')
        .eq('event_id', eventId as string)
        .order('start_time');
      if (error) throw error;
      return data;
    },
  });
}

/** Open Fair Day 1:1 slots for an event (booked + free), earliest first. */
export function useOneToOnes(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.oneToOnes(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('one_to_ones')
        .select('id, student_id, start_time, end_time, universities(name)')
        .eq('event_id', eventId as string)
        .order('start_time');
      if (error) throw error;
      return data;
    },
  });
}

/** The set of event ids the signed-in student is registered for. */
export function useMyEventRegistrations() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myEventRegistrations,
    queryFn: async () => {
      const { data, error } = await supabase.from('event_registrations').select('event_id');
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.event_id));
    },
  });
}

/** Register/unregister the current student for an event. `registered` is the current state. */
export function useToggleEventRegistration() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      eventId,
      registered,
    }: {
      studentId: string;
      eventId: string;
      registered: boolean;
    }) => {
      if (registered) {
        const { error } = await supabase
          .from('event_registrations')
          .delete()
          .eq('student_id', studentId)
          .eq('event_id', eventId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_registrations')
          .insert({ student_id: studentId, event_id: eventId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myEventRegistrations });
    },
  });
}

/** The set of workshop ids the signed-in student is registered for within one event. */
export function useMyWorkshopRegistrations(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myWorkshopRegistrations(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_registrations')
        .select('workshop_id, workshops!inner(event_id)')
        .eq('workshops.event_id', eventId as string);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.workshop_id));
    },
  });
}

/**
 * Register/unregister the current student for a workshop. The DB rejects a
 * registration that time-overlaps another one already held (see
 * `prevent_workshop_time_overlap` trigger) — surface that error to the caller.
 */
export function useToggleWorkshopRegistration() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      workshopId,
      registered,
    }: {
      studentId: string;
      workshopId: string;
      eventId: string;
      registered: boolean;
    }) => {
      if (registered) {
        const { error } = await supabase
          .from('workshop_registrations')
          .delete()
          .eq('student_id', studentId)
          .eq('workshop_id', workshopId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workshop_registrations')
          .insert({ student_id: studentId, workshop_id: workshopId });
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.myWorkshopRegistrations(vars.eventId) });
    },
  });
}

/** Book a free Open Fair Day 1:1 slot for the current student. */
export function useBookOneToOne() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string; eventId: string }) => {
      const { error } = await supabase.from('one_to_ones').update({ student_id: studentId }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.oneToOnes(vars.eventId) });
    },
  });
}

/** Free up a 1:1 slot the current student had booked. */
export function useCancelOneToOne() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('one_to_ones').update({ student_id: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.oneToOnes(vars.eventId) });
    },
  });
}

/** The current student's notes/ranking captured during an event, one per university. */
export function useEventNotes(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.eventNotes(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase.from('event_notes').select('*').eq('event_id', eventId as string);
      if (error) throw error;
      return data;
    },
  });
}

/** Create or update a student's note/ranking for one university at an event. */
export function useSaveEventNote() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      studentId: string;
      eventId: string;
      universityId: string;
      note: string;
      ranking: number | null;
    }) => {
      if (input.id) {
        const { error } = await supabase
          .from('event_notes')
          .update({ note: input.note, ranking: input.ranking })
          .eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('event_notes').insert({
          student_id: input.studentId,
          event_id: input.eventId,
          university_id: input.universityId,
          note: input.note,
          ranking: input.ranking,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.eventNotes(vars.eventId) });
    },
  });
}
