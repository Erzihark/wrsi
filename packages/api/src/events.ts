import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type EventNoteRow = Database['public']['Tables']['event_notes']['Row'];
export type WorkshopRow = Database['public']['Tables']['workshops']['Row'];
export type WorkshopInsert = Database['public']['Tables']['workshops']['Insert'];

/**
 * Workshops and 1:1 meetings are both request-and-approve flows (migration
 * 20260723000001). A student creates a `pending` row; staff schedule it and
 * move it to `approved` or `rejected`. The DB refuses a student-side status or
 * room change, so this type is only ever *written* by the staff hooks.
 */
export type RequestStatus = 'pending' | 'approved' | 'rejected';

// Strip characters meaningful to a PostgREST filter so a stray token can't
// malform the request (RLS still bounds the result). Mirrors students.ts/directory.ts.
const sanitize = (search?: string) => search?.trim().replace(/[(),*]/g, '');

/** Events list for the admin CRM (title search, most recent first). */
export function useEventsAdminList(search?: string) {
  const supabase = useSupabase();
  const term = sanitize(search);
  return useQuery({
    queryKey: [...queryKeys.events, 'admin', term ?? ''],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('id, title, start_date, end_date, states_provinces(name), countries(name, name_es)')
        .order('start_date', { ascending: false });
      if (term) query = query.ilike('title', `%${term}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/** Create an event. RLS enforces admin-only. */
export function useCreateEvent() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInsert) => {
      const { data, error } = await supabase.from('events').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}

/** Partial update to an event. RLS enforces admin-only. */
export function useUpdateEvent(id: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: EventUpdate) => {
      const { data, error } = await supabase.from('events').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.event(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}

/** Delete an event (cascades to registrations/workshops/1:1s/notes). RLS enforces admin-only. */
export function useDeleteEvent() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}

/** Add a university to an event's participating-universities list. */
export function useAddEventUniversity() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, universityId }: { eventId: string; universityId: string }) => {
      const { error } = await supabase
        .from('event_universities')
        .insert({ event_id: eventId, university_id: universityId });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.eventUniversities(vars.eventId) });
    },
  });
}

/** Remove a university from an event's participating-universities list. */
export function useRemoveEventUniversity() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, universityId }: { eventId: string; universityId: string }) => {
      const { error } = await supabase
        .from('event_universities')
        .delete()
        .eq('event_id', eventId)
        .eq('university_id', universityId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.eventUniversities(vars.eventId) });
    },
  });
}

/** Create a workshop within an event. */
export function useCreateWorkshop() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WorkshopInsert) => {
      const { data, error } = await supabase.from('workshops').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: queryKeys.eventWorkshops(data.event_id) });
    },
  });
}

/** Delete a workshop (cascades to its registrations). */
export function useDeleteWorkshop() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('workshops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.eventWorkshops(vars.eventId) });
    },
  });
}

// Event geography is captured as a structured country [+ state/province] pair, so
// list/detail reads embed both names for display. `states_provinces`/`countries`
// resolve via the single FK on each id.
const EVENT_SELECT = '*, states_provinces(name), countries(name, name_es)';

/** All WX events (fairs, Open Fair Day, ...), soonest first. RLS: readable by all authenticated users. */
export function useEvents() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select(EVENT_SELECT).order('start_date');
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
        .select(EVENT_SELECT)
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Universities participating in an event, alphabetical.
 *
 * Embeds the geography ("Florida, USA") and description the "Universidades
 * participantes" list and university sheet render. Universities have no `city`
 * column, so the location line is state + country — see docs/DESIGN.md notes on
 * the event screens.
 */
export function useEventUniversities(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.eventUniversities(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_universities')
        .select(
          'universities(id, name, logo_url, website, description, states_provinces(name, countries(name, name_es)))',
        )
        .eq('event_id', eventId as string);
      if (error) throw error;
      return data
        .map((r) => r.universities)
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export type EventUniversity = NonNullable<
  ReturnType<typeof useEventUniversities>['data']
>[number];

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

/**
 * The signed-in student's event registrations, keyed by event id and valued by
 * the registration timestamp — the pre-event card's "Registrado el 22 de Mayo,
 * 2026" line. A `Map` rather than a `Set` so `.has(id)` keeps reading the same
 * at every existing call site while the date becomes available.
 */
export function useMyEventRegistrations() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myEventRegistrations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id, created_at');
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.event_id, r.created_at]));
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

// ---------------------------------------------------------------------------
// Workshop requests (student side)
// ---------------------------------------------------------------------------

/**
 * The signed-in student's workshop requests within one event, with the
 * workshop's own schedule embedded — this backs the Disponibles / Solicitados /
 * Aprobados tabs. RLS returns only the student's own rows, so no student filter
 * is needed; `workshops!inner` scopes the join to this event.
 */
export function useMyWorkshopRequests(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myWorkshopRequests(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_registrations')
        .select(
          'workshop_id, status, room, created_at, decided_at, workshops!inner(id, event_id, title, start_time, end_time, universities(name))',
        )
        .eq('workshops.event_id', eventId as string);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type MyWorkshopRequest = NonNullable<
  ReturnType<typeof useMyWorkshopRequests>['data']
>[number];

/**
 * Ask to join a workshop. The row is created `pending` regardless of what is
 * sent — `enforce_request_decision_authority` overwrites status/room for
 * non-staff — so this deliberately posts only the two identifying columns.
 */
export function useRequestWorkshop() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, workshopId }: { studentId: string; workshopId: string; eventId: string }) => {
      const { error } = await supabase
        .from('workshop_registrations')
        .insert({ student_id: studentId, workshop_id: workshopId });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.myWorkshopRequests(vars.eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.eventWorkshopRequests(vars.eventId) });
    },
  });
}

/** Withdraw a workshop request (or give up an approved spot). */
export function useCancelWorkshopRequest() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, workshopId }: { studentId: string; workshopId: string; eventId: string }) => {
      const { error } = await supabase
        .from('workshop_registrations')
        .delete()
        .eq('student_id', studentId)
        .eq('workshop_id', workshopId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.myWorkshopRequests(vars.eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.eventWorkshopRequests(vars.eventId) });
    },
  });
}

// ---------------------------------------------------------------------------
// 1:1 meeting requests (student side)
// ---------------------------------------------------------------------------

/**
 * The signed-in student's 1:1 meeting requests for one event — the Solicitados
 * / Aprobados / Rechazados tabs. `start_time`/`end_time`/`room` are null until
 * staff schedule the meeting.
 */
export function useMyMeetingRequests(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.myMeetingRequests(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('one_to_ones')
        .select('id, university_id, status, room, start_time, end_time, student_note, created_at, universities(name, logo_url)')
        .eq('event_id', eventId as string)
        .not('student_id', 'is', null)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type MyMeetingRequest = NonNullable<
  ReturnType<typeof useMyMeetingRequests>['data']
>[number];

/**
 * Ask for a 1:1 with a university at an event. The partial unique index
 * `one_to_ones_one_live_request_per_university` rejects a second live request
 * for the same university, which surfaces here as a duplicate-key error.
 */
export function useRequestMeeting() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      eventId,
      universityId,
      note,
    }: {
      studentId: string;
      eventId: string;
      universityId: string;
      note?: string;
    }) => {
      const { error } = await supabase.from('one_to_ones').insert({
        student_id: studentId,
        event_id: eventId,
        university_id: universityId,
        student_note: note?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.myMeetingRequests(vars.eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.eventMeetingRequests(vars.eventId) });
    },
  });
}

/** Withdraw a 1:1 request (or cancel an approved meeting). */
export function useCancelMeetingRequest() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('one_to_ones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.myMeetingRequests(vars.eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.eventMeetingRequests(vars.eventId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Staff approval queues
// ---------------------------------------------------------------------------

/** Every student's workshop requests for an event, for the admin approval queue. */
export function useEventWorkshopRequests(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.eventWorkshopRequests(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_registrations')
        .select(
          'workshop_id, student_id, status, room, created_at, students(first_name, last_name), workshops!inner(id, event_id, title, start_time, end_time)',
        )
        .eq('workshops.event_id', eventId as string)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Every student's 1:1 requests for an event, for the admin approval queue. */
export function useEventMeetingRequests(eventId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.eventMeetingRequests(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('one_to_ones')
        .select(
          'id, student_id, university_id, status, room, start_time, end_time, student_note, created_at, students(first_name, last_name), universities(name)',
        )
        .eq('event_id', eventId as string)
        .not('student_id', 'is', null)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Approve or reject a workshop request, optionally assigning a room.
 *
 * Approving runs the `prevent_workshop_time_overlap` trigger against the
 * student's other *approved* workshops, so a double-booking surfaces here as a
 * check-violation error rather than being silently accepted. RLS + the
 * decision-authority trigger both enforce that only staff reach this.
 */
export function useDecideWorkshopRequest() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      workshopId,
      status,
      room,
    }: {
      studentId: string;
      workshopId: string;
      eventId: string;
      status: RequestStatus;
      room?: string | null;
    }) => {
      const { error } = await supabase
        .from('workshop_registrations')
        .update({ status, room: room?.trim() || null })
        .eq('student_id', studentId)
        .eq('workshop_id', workshopId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.eventWorkshopRequests(vars.eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.myWorkshopRequests(vars.eventId) });
    },
  });
}

/**
 * Schedule and decide a 1:1 request: staff set the time and room and approve,
 * or reject. Times are sent as full ISO timestamps built from the event's date.
 */
export function useDecideMeetingRequest() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      startTime,
      endTime,
      room,
    }: {
      id: string;
      eventId: string;
      status: RequestStatus;
      startTime?: string | null;
      endTime?: string | null;
      room?: string | null;
    }) => {
      const { error } = await supabase
        .from('one_to_ones')
        .update({
          status,
          start_time: startTime ?? null,
          end_time: endTime ?? null,
          room: room?.trim() || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.eventMeetingRequests(vars.eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.myMeetingRequests(vars.eventId) });
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
