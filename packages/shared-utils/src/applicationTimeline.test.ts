import { describe, expect, it } from 'vitest';
import {
  computeApplicationTimeline,
  countApplications,
  matchesApplicationFilter,
  computeOverallApplicationProgress,
  type TimelineHistoryEntry,
} from './applicationTimeline';

const CREATED = '2026-09-10T00:00:00Z';

const history: TimelineHistoryEntry[] = [
  { changed_at: '2026-09-18T00:00:00Z', status: { name: 'Submitted' } },
  { changed_at: '2026-10-05T00:00:00Z', status: { name: 'Under Review' } },
  { changed_at: '2026-11-10T00:00:00Z', status: { name: 'Accepted', is_terminal: true } },
];

/** Compact view of a timeline for readable assertions. */
const shape = (input: Parameters<typeof computeApplicationTimeline>[0]) =>
  computeApplicationTimeline(input).steps.map((s) => [s.key, s.state, s.at]);

describe('computeApplicationTimeline', () => {
  it('marks every step done for a terminal status, dating each from its history', () => {
    expect(
      shape({ createdAt: CREATED, status: { name: 'Accepted', is_terminal: true }, history }),
    ).toEqual([
      ['started', 'done', CREATED],
      ['documents', 'done', '2026-09-18T00:00:00Z'],
      ['review', 'done', '2026-10-05T00:00:00Z'],
      ['decision', 'done', '2026-11-10T00:00:00Z'],
    ]);
  });

  it('leaves the decision pending while under review', () => {
    expect(
      shape({
        createdAt: CREATED,
        status: { name: 'Under Review' },
        history: history.slice(0, 2),
      }),
    ).toEqual([
      ['started', 'done', CREATED],
      ['documents', 'done', '2026-09-18T00:00:00Z'],
      ['review', 'current', '2026-10-05T00:00:00Z'],
      ['decision', 'pending', null],
    ]);
  });

  it('shows a draft with no step reached at all', () => {
    const timeline = computeApplicationTimeline({
      createdAt: CREATED,
      status: { name: 'Draft' },
      history: [],
    });
    expect(timeline.steps.every((s) => s.state === 'pending' && s.at === null)).toBe(true);
    expect(timeline.currentIndex).toBe(-1);
    expect(timeline.progress).toBe(0);
  });

  it('dates a milestone from the first time it was reached, not the latest', () => {
    // An application bounced back to review keeps its original review date.
    const steps = shape({
      createdAt: CREATED,
      status: { name: 'Under Review' },
      history: [
        { changed_at: '2026-10-05T00:00:00Z', status: { name: 'Under Review' } },
        { changed_at: '2026-12-01T00:00:00Z', status: { name: 'Under Review' } },
      ],
    });
    expect(steps[2]).toEqual(['review', 'current', '2026-10-05T00:00:00Z']);
  });

  it('reports a reached-but-undated step rather than dropping it', () => {
    // History can be missing (imported applications) — the step still shows as
    // passed, just without a date.
    expect(shape({ createdAt: CREATED, status: { name: 'Under Review' }, history: [] })).toEqual([
      ['started', 'done', CREATED],
      ['documents', 'done', null],
      ['review', 'current', null],
      ['decision', 'pending', null],
    ]);
  });

  it('falls back for statuses the milestone map has never seen', () => {
    // Admins can add statuses to the catalog; terminal ones are a decision,
    // everything else is treated as in-review.
    expect(computeApplicationTimeline({ createdAt: CREATED, status: { name: 'Waitlisted' } })
      .currentIndex).toBe(2);
    expect(
      computeApplicationTimeline({
        createdAt: CREATED,
        status: { name: 'Withdrawn', is_terminal: true },
      }).currentIndex,
    ).toBe(3);
  });

  it('treats a missing status as a draft', () => {
    expect(computeApplicationTimeline({ createdAt: CREATED, status: null }).currentIndex).toBe(-1);
  });
});

describe('computeOverallApplicationProgress', () => {
  it('averages the per-application progress', () => {
    expect(computeOverallApplicationProgress([{ progress: 1 }, { progress: 0.5 }])).toBe(0.75);
  });

  it('is zero with no applications', () => {
    expect(computeOverallApplicationProgress([])).toBe(0);
  });
});

describe('application filters', () => {
  const rows = [
    { status: { name: 'Draft' } },
    { status: { name: 'Submitted' } },
    { status: { name: 'Under Review' } },
    { status: { name: 'Accepted' } },
    { status: { name: 'Enrolled' } },
    { status: null },
  ];

  it('counts each tile bucket, folding Enrolled into accepted', () => {
    expect(countApplications(rows)).toEqual({ all: 6, review: 1, accepted: 2, draft: 1 });
  });

  it('is empty-safe', () => {
    expect(countApplications(null)).toEqual({ all: 0, review: 0, accepted: 0, draft: 0 });
  });

  it('matches "all" for everything, including a status-less row', () => {
    expect(rows.every((r) => matchesApplicationFilter(r.status?.name, 'all'))).toBe(true);
    expect(matchesApplicationFilter(null, 'draft')).toBe(false);
  });
});
