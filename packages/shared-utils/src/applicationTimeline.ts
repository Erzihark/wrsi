/**
 * Timeline math for the "Mis aplicaciones" cards: turns an application's current
 * status plus its status history into the designed four-milestone tracker
 * (Iniciada → Documentos enviados → En revisión → Decisión final).
 *
 * The four milestones are a *presentation* grouping, not a table: the DB stores
 * a six-entry status catalog (`statuses` where `entity_type = 'application'`),
 * and the three terminal outcomes (Accepted / Rejected / Enrolled) all collapse
 * into the single "Decisión final" step the designer drew.
 */

export const APPLICATION_MILESTONES = ['started', 'documents', 'review', 'decision'] as const;

export type ApplicationMilestone = (typeof APPLICATION_MILESTONES)[number];

/** `done` = passed, `current` = where the application sits now, `pending` = not reached. */
export type MilestoneState = 'done' | 'current' | 'pending';

export interface ApplicationTimelineStep {
  key: ApplicationMilestone;
  state: MilestoneState;
  /** ISO timestamp the milestone was reached; null when not reached (or undated). */
  at: string | null;
}

export interface ApplicationTimeline {
  steps: ApplicationTimelineStep[];
  /** Index of the milestone the application currently sits on; -1 for a draft. */
  currentIndex: number;
  /** Milestones reached ÷ 4 — feeds the per-card and overall progress bars. */
  progress: number;
}

export interface TimelineStatus {
  name: string;
  is_terminal?: boolean | null;
}

export interface TimelineHistoryEntry {
  changed_at: string;
  status: TimelineStatus | null;
}

export interface TimelineInput {
  /** The application row's `created_at` — the date shown on "Iniciada". */
  createdAt: string;
  status: TimelineStatus | null;
  history?: TimelineHistoryEntry[] | null;
}

/**
 * Which milestone a catalog status belongs to. Keyed on the seeded status names
 * (see `supabase/seed.sql`); `Draft` deliberately maps to -1 because the design
 * shows a draft card with *no* step filled in, not even "Iniciada" — a draft is
 * something staff started, not an application the student has under way.
 */
const MILESTONE_BY_STATUS: Record<string, number> = {
  Draft: -1,
  Submitted: 1,
  'Under Review': 2,
  Accepted: 3,
  Rejected: 3,
  Enrolled: 3,
};

function milestoneIndex(status: TimelineStatus | null | undefined): number {
  if (!status) return -1;
  const known = MILESTONE_BY_STATUS[status.name];
  if (known !== undefined) return known;
  // The status catalog is DB-configurable, so an admin can add a name this
  // mapping has never seen. Terminal ones are a final decision by definition;
  // anything else is safest shown as "in review" rather than silently blank.
  return status.is_terminal ? 3 : 2;
}

export function computeApplicationTimeline({
  createdAt,
  status,
  history,
}: TimelineInput): ApplicationTimeline {
  const currentIndex = milestoneIndex(status);
  const isTerminal = Boolean(status?.is_terminal);

  // Earliest history entry per milestone: a status can be revisited (sent back
  // for review, say), and the tracker should date when the step was *first*
  // reached rather than the most recent bounce.
  const reachedAt = new Map<number, string>();
  for (const entry of history ?? []) {
    const index = milestoneIndex(entry.status);
    if (index < 1) continue;
    const existing = reachedAt.get(index);
    if (!existing || entry.changed_at < existing) reachedAt.set(index, entry.changed_at);
  }

  const steps = APPLICATION_MILESTONES.map((key, index) => {
    const state: MilestoneState =
      index < currentIndex || (index === currentIndex && isTerminal)
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'pending';

    // "Iniciada" has no status of its own — it's the row's creation date, shown
    // only once the application is past draft.
    const at =
      state === 'pending' ? null : index === 0 ? createdAt : (reachedAt.get(index) ?? null);

    return { key, state, at };
  });

  return {
    steps,
    currentIndex,
    progress: Math.max(0, currentIndex + 1) / APPLICATION_MILESTONES.length,
  };
}

/**
 * The buckets behind the four summary tiles, which double as the list's filter.
 * `accepted` covers Enrolled too: from the student's point of view an enrolled
 * application is an accepted one that went further, not a separate outcome.
 */
export type ApplicationFilter = 'all' | 'review' | 'accepted' | 'draft';

const FILTER_STATUSES: Record<Exclude<ApplicationFilter, 'all'>, string[]> = {
  review: ['Under Review'],
  accepted: ['Accepted', 'Enrolled'],
  draft: ['Draft'],
};

export function matchesApplicationFilter(
  statusName: string | null | undefined,
  filter: ApplicationFilter,
): boolean {
  if (filter === 'all') return true;
  return statusName != null && FILTER_STATUSES[filter].includes(statusName);
}

export interface ApplicationCounts {
  all: number;
  review: number;
  accepted: number;
  draft: number;
}

/** Tile counts for a list of applications, in one pass. */
export function countApplications(
  applications: { status: { name: string } | null }[] | null | undefined,
): ApplicationCounts {
  const rows = applications ?? [];
  return {
    all: rows.length,
    review: rows.filter((r) => matchesApplicationFilter(r.status?.name, 'review')).length,
    accepted: rows.filter((r) => matchesApplicationFilter(r.status?.name, 'accepted')).length,
    draft: rows.filter((r) => matchesApplicationFilter(r.status?.name, 'draft')).length,
  };
}

/** Mean completion across a student's applications — the "Tu progreso general" bar. */
export function computeOverallApplicationProgress(
  timelines: Pick<ApplicationTimeline, 'progress'>[],
): number {
  if (timelines.length === 0) return 0;
  return timelines.reduce((sum, t) => sum + t.progress, 0) / timelines.length;
}
