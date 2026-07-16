/**
 * Journey ("Tu viaje WRSI") progress math for the student dashboard: turns the
 * ordered student-lifecycle status catalog + the student's current status into
 * a percent bar, the current/next step names, and the steps-remaining count.
 */

export interface JourneyStatus {
  id: string;
  name: string;
  sort_order: number;
}

export interface JourneyProgress {
  /** 0–100, rounded. 0 when the student has no status history yet. */
  percent: number;
  /** Index of the current status in the ordered list, -1 when none. */
  currentIndex: number;
  /** Name of the current step, null when the journey hasn't started. */
  currentName: string | null;
  /** Name of the next step, null when the current step is the last. */
  nextName: string | null;
  /** Steps left after the current one ("Faltan N pasos"). */
  remaining: number;
  total: number;
}

export function computeJourneyProgress(
  statuses: JourneyStatus[] | null | undefined,
  currentStatusId: string | null | undefined,
): JourneyProgress {
  const ordered = [...(statuses ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const total = ordered.length;
  const currentIndex = currentStatusId
    ? ordered.findIndex((s) => s.id === currentStatusId)
    : -1;

  if (total === 0 || currentIndex === -1) {
    return {
      percent: 0,
      currentIndex: -1,
      currentName: null,
      nextName: ordered[0]?.name ?? null,
      remaining: total,
      total,
    };
  }

  return {
    percent: Math.round(((currentIndex + 1) / total) * 100),
    currentIndex,
    currentName: ordered[currentIndex]!.name,
    nextName: ordered[currentIndex + 1]?.name ?? null,
    remaining: total - (currentIndex + 1),
    total,
  };
}
