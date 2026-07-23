/**
 * Pure logic behind the student's event experience — the designer's pre /
 * during / post views of a single event.
 *
 * Everything here is deliberately free of React and of the Supabase client so
 * the three phases, the readiness checklist, the agenda merge and the post-event
 * summary are all unit-testable without a backend.
 *
 * Times: workshops and meetings are `timestamptz`, so they're formatted from a
 * real `Date` (device-local, which is what a student at the venue wants).
 * `Intl` is avoided for the same reason as `eventsDisplay.ts` — Hermes ships
 * incomplete locale data, and the output must be identical on iOS, Android and
 * in tests.
 */

export type EventPhase = 'upcoming' | 'live' | 'past';

export interface EventDatesLike {
  start_date: string | null;
  end_date: string | null;
}

/**
 * Which of the three designed views an event is in.
 *
 * Dates are compared as `YYYY-MM-DD` strings (lexicographic ordering is
 * chronological for ISO dates), so no timezone conversion can shift the phase
 * by a day. An event with no start date is treated as `upcoming` — it has been
 * created but not scheduled, and "Evento finalizado" would be a lie.
 */
export function eventPhase(event: EventDatesLike, todayISO: string): EventPhase {
  const start = event.start_date;
  const end = event.end_date ?? start;
  if (!start) return 'upcoming';
  if (todayISO < start) return 'upcoming';
  if (end && todayISO > end) return 'past';
  return 'live';
}

// ---------------------------------------------------------------------------
// Readiness checklist ("Preparando tu experiencia", 4/5 in the comp)
// ---------------------------------------------------------------------------

/** The five actions the comp counts toward being ready for the event. */
export type EventPrepStepKey =
  | 'register'
  | 'explore'
  | 'ranking'
  | 'meetings'
  | 'workshops';

export interface EventPrepInput {
  registered: boolean;
  /** Participating universities the student marked interesada **or** favorita. */
  interestedCount: number;
  /** Participating universities marked favorita (the ones that form the top). */
  favoriteCount: number;
  meetingRequestCount: number;
  workshopRequestCount: number;
}

export interface EventPrepStep {
  key: EventPrepStepKey;
  done: boolean;
}

export interface EventPrepProgress {
  steps: EventPrepStep[];
  completed: number;
  total: number;
  /** 0–1, for the comp's progress ring. */
  ratio: number;
}

/**
 * How ready the student is for the event. The comp shows "4/5" in a ring with
 * no legend for what the five are, so they're defined here as the five actions
 * the pre-event screen itself offers — registering, exploring the universities,
 * building a top, and asking for the two kinds of session.
 *
 * `FAVORITES_FOR_RANKING` is the threshold at which a personal top is a
 * ranking rather than a single starred row.
 */
export const FAVORITES_FOR_RANKING = 3;

export function computeEventPrep(input: EventPrepInput): EventPrepProgress {
  const steps: EventPrepStep[] = [
    { key: 'register', done: input.registered },
    { key: 'explore', done: input.interestedCount > 0 },
    { key: 'ranking', done: input.favoriteCount >= FAVORITES_FOR_RANKING },
    { key: 'meetings', done: input.meetingRequestCount > 0 },
    { key: 'workshops', done: input.workshopRequestCount > 0 },
  ];
  const completed = steps.filter((s) => s.done).length;
  return { steps, completed, total: steps.length, ratio: completed / steps.length };
}

// ---------------------------------------------------------------------------
// Agenda ("Mi agenda" / "Próxima actividad")
// ---------------------------------------------------------------------------

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface AgendaItem {
  id: string;
  kind: 'workshop' | 'meeting';
  title: string;
  /** University name, when the session belongs to one. */
  universityName: string | null;
  /** ISO timestamp; null for an approved session staff haven't timed yet. */
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  status: RequestStatus;
}

/**
 * The student's personal schedule: approved sessions only, earliest first.
 *
 * Pending and rejected requests are excluded on purpose — an agenda that lists
 * things you might not be attending isn't an agenda. They stay visible in the
 * Solicitados / Rechazados tabs of their own screens. Approved-but-untimed
 * sessions sort last rather than being dropped, since the student still needs
 * to know they exist.
 */
export function buildAgenda(items: AgendaItem[]): AgendaItem[] {
  return items
    .filter((i) => i.status === 'approved')
    .slice()
    .sort((a, b) => {
      if (a.startTime === b.startTime) return a.title.localeCompare(b.title);
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
}

/**
 * "Próxima actividad" — the next approved session that hasn't finished yet.
 * Falls back to `startTime` when a session has no end, so a session currently
 * running still counts as the current activity rather than being skipped.
 */
export function nextAgendaItem(agenda: AgendaItem[], now: Date = new Date()): AgendaItem | null {
  const nowMs = now.getTime();
  for (const item of agenda) {
    if (!item.startTime) continue;
    const endMs = Date.parse(item.endTime ?? item.startTime);
    if (Number.isNaN(endMs)) continue;
    if (endMs >= nowMs) return item;
  }
  return null;
}

/** Group an agenda into calendar days, keyed by the local `YYYY-MM-DD`. */
export function groupAgendaByDay(agenda: AgendaItem[]): { day: string | null; items: AgendaItem[] }[] {
  const groups: { day: string | null; items: AgendaItem[] }[] = [];
  for (const item of agenda) {
    const day = localDayKey(item.startTime);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

/** Local calendar day of an ISO timestamp, as `YYYY-MM-DD`; null if unparseable. */
export function localDayKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `'2026-11-11T16:30:00+00:00'` → `'10:30 AM'` in the device's timezone. */
export function formatTimestampTime12h(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hours = d.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${String(d.getMinutes()).padStart(2, '0')} ${suffix}`;
}

/** `'10:30 AM - 11:30 AM'`, or just the start when there's no end. */
export function formatTimestampRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const from = formatTimestampTime12h(start);
  if (!from) return null;
  const to = formatTimestampTime12h(end);
  return to ? `${from} - ${to}` : from;
}

// ---------------------------------------------------------------------------
// University interest (Favorita ★ / Interesada ☆) + personal ranking
// ---------------------------------------------------------------------------

export type InterestLevel = 'interested' | 'favorite';

export interface InterestRowLike {
  university_id: string;
  interest_level: InterestLevel;
  rank: number | null;
  created_at: string;
}

export type UniversityFilter = 'all' | 'favorite' | 'interested';

/** Does a university pass the comp's Todas / Favoritas / Interesadas filter? */
export function matchesUniversityFilter(
  level: InterestLevel | null | undefined,
  filter: UniversityFilter,
): boolean {
  if (filter === 'all') return true;
  return level === filter;
}

/**
 * The student's top list, in ranked order.
 *
 * `rank` is not uniquely constrained in the DB (see the column comment — a
 * reorder rewrites the block in one statement and a unique index would reject
 * the intermediate state), so ties and gaps are both possible. Sorting falls
 * back to `created_at` and then the id, which makes the order total and stable
 * no matter what the stored ranks look like.
 */
export function sortByRank<T extends InterestRowLike>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => {
    if (a.rank !== b.rank) {
      if (a.rank == null) return 1;
      if (b.rank == null) return -1;
      return a.rank - b.rank;
    }
    if (a.created_at !== b.created_at) return a.created_at.localeCompare(b.created_at);
    return a.university_id.localeCompare(b.university_id);
  });
}

/**
 * Renumber a reordered list to a dense 1..N. Returned as the minimal set of
 * rows whose rank actually changed, so a drag that moves one item doesn't
 * rewrite every row in the table.
 */
export function renumberRanks(
  ordered: { university_id: string; rank: number | null }[],
): { university_id: string; rank: number }[] {
  const changed: { university_id: string; rank: number }[] = [];
  ordered.forEach((row, index) => {
    const rank = index + 1;
    if (row.rank !== rank) changed.push({ university_id: row.university_id, rank });
  });
  return changed;
}

/** Move the item at `from` to `to`, returning a new array. Out-of-range is a no-op. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list;
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

// ---------------------------------------------------------------------------
// Post-event summary ("Resumen del evento")
// ---------------------------------------------------------------------------

export interface EventSummaryInput {
  /** Universities participating in the event. */
  universityCount: number;
  /** Notes the student captured, one per university. */
  notedUniversityIds: string[];
  favoriteCount: number;
  agenda: AgendaItem[];
}

export interface EventSummary {
  universityCount: number;
  universitiesNoted: number;
  favoriteCount: number;
  meetingsAttended: number;
  workshopsAttended: number;
  /** Share of the event's universities the student captured a note for, 0–1. */
  coverage: number;
}

/**
 * The post-event recap. Derived entirely from what the student already did —
 * there's no attendance scanning, so "attended" means "had an approved
 * session", which is the closest honest proxy.
 */
export function computeEventSummary(input: EventSummaryInput): EventSummary {
  const approved = input.agenda.filter((i) => i.status === 'approved');
  const universitiesNoted = new Set(input.notedUniversityIds).size;
  return {
    universityCount: input.universityCount,
    universitiesNoted,
    favoriteCount: input.favoriteCount,
    meetingsAttended: approved.filter((i) => i.kind === 'meeting').length,
    workshopsAttended: approved.filter((i) => i.kind === 'workshop').length,
    coverage: input.universityCount > 0 ? universitiesNoted / input.universityCount : 0,
  };
}

/** Count requests by status, for the comp's "Solicitados (3) / Aprobados (2)" tabs. */
export function countByStatus(rows: { status: RequestStatus }[]): Record<RequestStatus, number> {
  return {
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };
}
