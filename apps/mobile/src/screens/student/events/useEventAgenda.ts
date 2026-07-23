import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMyMeetingRequests, useMyWorkshopRequests } from '@wrsi/api';
import { type AgendaItem, buildAgenda, type RequestStatus } from '@wrsi/shared-utils';

/**
 * The student's workshop + 1:1 requests for one event, normalized into a single
 * `AgendaItem[]`.
 *
 * Returns both the raw merged list (every status — the Solicitados /
 * Rechazados tabs need it) and `agenda`, the approved-only, time-sorted subset
 * the "Mi agenda" screen and the "Próxima actividad" card render. Both screens
 * read the same two queries, so this shares the cache rather than refetching.
 */
export function useEventAgenda(eventId: string | undefined) {
  const { t } = useTranslation();
  const workshops = useMyWorkshopRequests(eventId);
  const meetings = useMyMeetingRequests(eventId);

  const items = useMemo<AgendaItem[]>(() => {
    const fromWorkshops: AgendaItem[] = (workshops.data ?? []).map((r) => ({
      id: `workshop:${r.workshop_id}`,
      kind: 'workshop',
      title: r.workshops?.title ?? t('eventDetail.agenda.workshop'),
      universityName: r.workshops?.universities?.name ?? null,
      startTime: r.workshops?.start_time ?? null,
      endTime: r.workshops?.end_time ?? null,
      room: r.room,
      status: r.status as RequestStatus,
    }));

    const fromMeetings: AgendaItem[] = (meetings.data ?? []).map((r) => ({
      id: `meeting:${r.id}`,
      kind: 'meeting',
      // A 1:1 has no title of its own — the university *is* the subject, which
      // is exactly how the comp's "Próxima actividad" card labels it.
      title: r.universities?.name ?? t('eventDetail.agenda.meeting'),
      universityName: r.universities?.name ?? null,
      startTime: r.start_time,
      endTime: r.end_time,
      room: r.room,
      status: r.status as RequestStatus,
    }));

    return [...fromWorkshops, ...fromMeetings];
  }, [workshops.data, meetings.data, t]);

  const agenda = useMemo(() => buildAgenda(items), [items]);

  return {
    items,
    agenda,
    isLoading: workshops.isLoading || meetings.isLoading,
    workshopRequests: workshops,
    meetingRequests: meetings,
  };
}
