import { describe, expect, it } from 'vitest';
import {
  type AgendaItem,
  buildAgenda,
  computeEventPrep,
  computeEventSummary,
  countByStatus,
  eventPhase,
  formatTimestampRange,
  formatTimestampTime12h,
  groupAgendaByDay,
  matchesUniversityFilter,
  moveItem,
  nextAgendaItem,
  renumberRanks,
  sortByRank,
} from './eventExperience';

/** Local-time timestamp, so the tests don't depend on the runner's timezone. */
const at = (day: string, time: string) => new Date(`${day}T${time}`).toISOString();

function agendaItem(overrides: Partial<AgendaItem> & { id: string }): AgendaItem {
  return {
    kind: 'workshop',
    title: 'Workshop',
    universityName: null,
    startTime: null,
    endTime: null,
    room: null,
    status: 'approved',
    ...overrides,
  };
}

describe('eventPhase', () => {
  const event = { start_date: '2026-11-09', end_date: '2026-11-15' };

  it('is upcoming before the start date', () => {
    expect(eventPhase(event, '2026-11-08')).toBe('upcoming');
  });

  it('is live on the start date, in the middle, and on the end date', () => {
    expect(eventPhase(event, '2026-11-09')).toBe('live');
    expect(eventPhase(event, '2026-11-12')).toBe('live');
    expect(eventPhase(event, '2026-11-15')).toBe('live');
  });

  it('is past the day after it ends', () => {
    expect(eventPhase(event, '2026-11-16')).toBe('past');
  });

  it('treats a single-day event (no end_date) as ending on its start date', () => {
    const oneDay = { start_date: '2026-11-09', end_date: null };
    expect(eventPhase(oneDay, '2026-11-09')).toBe('live');
    expect(eventPhase(oneDay, '2026-11-10')).toBe('past');
  });

  it('treats an unscheduled event as upcoming rather than finished', () => {
    expect(eventPhase({ start_date: null, end_date: null }, '2026-11-09')).toBe('upcoming');
  });
});

describe('computeEventPrep', () => {
  const none = {
    registered: false,
    interestedCount: 0,
    favoriteCount: 0,
    meetingRequestCount: 0,
    workshopRequestCount: 0,
  };

  it('counts nothing done for a student who has not started', () => {
    const prep = computeEventPrep(none);
    expect(prep.completed).toBe(0);
    expect(prep.total).toBe(5);
    expect(prep.ratio).toBe(0);
  });

  it('reaches the comp\'s 4/5 when only the ranking threshold is short', () => {
    const prep = computeEventPrep({
      registered: true,
      interestedCount: 12,
      favoriteCount: 2,
      meetingRequestCount: 4,
      workshopRequestCount: 3,
    });
    expect(prep.completed).toBe(4);
    expect(prep.ratio).toBeCloseTo(0.8);
    expect(prep.steps.find((s) => s.key === 'ranking')?.done).toBe(false);
  });

  it('completes the ranking step at three favorites', () => {
    expect(computeEventPrep({ ...none, favoriteCount: 2 }).steps[2]!.done).toBe(false);
    expect(computeEventPrep({ ...none, favoriteCount: 3 }).steps[2]!.done).toBe(true);
  });

  it('is fully complete when every action has been taken', () => {
    const prep = computeEventPrep({
      registered: true,
      interestedCount: 1,
      favoriteCount: 3,
      meetingRequestCount: 1,
      workshopRequestCount: 1,
    });
    expect(prep.completed).toBe(5);
    expect(prep.ratio).toBe(1);
  });
});

describe('buildAgenda', () => {
  const items = [
    agendaItem({ id: 'later', startTime: at('2026-11-11', '14:00:00'), title: 'Later' }),
    agendaItem({ id: 'pending', startTime: at('2026-11-11', '09:00:00'), status: 'pending' }),
    agendaItem({ id: 'rejected', startTime: at('2026-11-11', '08:00:00'), status: 'rejected' }),
    agendaItem({ id: 'early', startTime: at('2026-11-11', '10:00:00'), title: 'Early' }),
    agendaItem({ id: 'untimed', title: 'Untimed' }),
  ];

  it('keeps only approved sessions, earliest first', () => {
    expect(buildAgenda(items).map((i) => i.id)).toEqual(['early', 'later', 'untimed']);
  });

  it('sorts approved-but-untimed sessions last instead of dropping them', () => {
    expect(buildAgenda(items).at(-1)?.id).toBe('untimed');
  });

  it('breaks ties on title so the order is stable', () => {
    const same = at('2026-11-11', '10:00:00');
    const tied = [
      agendaItem({ id: 'b', startTime: same, title: 'Beta' }),
      agendaItem({ id: 'a', startTime: same, title: 'Alpha' }),
    ];
    expect(buildAgenda(tied).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('does not mutate its input', () => {
    const input = [...items];
    buildAgenda(input);
    expect(input.map((i) => i.id)).toEqual(items.map((i) => i.id));
  });
});

describe('nextAgendaItem', () => {
  const agenda = buildAgenda([
    agendaItem({
      id: 'morning',
      startTime: at('2026-11-11', '10:00:00'),
      endTime: at('2026-11-11', '11:00:00'),
    }),
    agendaItem({
      id: 'afternoon',
      startTime: at('2026-11-11', '14:00:00'),
      endTime: at('2026-11-11', '15:00:00'),
    }),
  ]);

  it('picks the first session that has not ended', () => {
    expect(nextAgendaItem(agenda, new Date(at('2026-11-11', '09:00:00')))?.id).toBe('morning');
  });

  it('keeps a session that is currently running as the current activity', () => {
    expect(nextAgendaItem(agenda, new Date(at('2026-11-11', '10:30:00')))?.id).toBe('morning');
  });

  it('moves on once a session has ended', () => {
    expect(nextAgendaItem(agenda, new Date(at('2026-11-11', '11:30:00')))?.id).toBe('afternoon');
  });

  it('returns null when the day is over', () => {
    expect(nextAgendaItem(agenda, new Date(at('2026-11-11', '18:00:00')))).toBeNull();
  });

  it('skips untimed sessions rather than crashing on them', () => {
    const withUntimed = buildAgenda([agendaItem({ id: 'untimed' })]);
    expect(nextAgendaItem(withUntimed, new Date(at('2026-11-11', '09:00:00')))).toBeNull();
  });
});

describe('groupAgendaByDay', () => {
  it('groups consecutive sessions into their local calendar day', () => {
    const agenda = buildAgenda([
      agendaItem({ id: 'd1a', startTime: at('2026-11-11', '10:00:00') }),
      agendaItem({ id: 'd1b', startTime: at('2026-11-11', '14:00:00') }),
      agendaItem({ id: 'd2', startTime: at('2026-11-12', '09:00:00') }),
    ]);
    const groups = groupAgendaByDay(agenda);
    expect(groups.map((g) => g.day)).toEqual(['2026-11-11', '2026-11-12']);
    expect(groups[0]!.items).toHaveLength(2);
  });

  it('puts untimed sessions in their own null-day group', () => {
    const agenda = buildAgenda([
      agendaItem({ id: 'timed', startTime: at('2026-11-11', '10:00:00') }),
      agendaItem({ id: 'untimed' }),
    ]);
    expect(groupAgendaByDay(agenda).at(-1)?.day).toBeNull();
  });
});

describe('formatTimestampTime12h', () => {
  it('formats a morning time', () => {
    expect(formatTimestampTime12h(at('2026-11-11', '10:30:00'))).toBe('10:30 AM');
  });

  it('formats an afternoon time', () => {
    expect(formatTimestampTime12h(at('2026-11-11', '14:05:00'))).toBe('2:05 PM');
  });

  it('renders midnight and noon as 12, not 0', () => {
    expect(formatTimestampTime12h(at('2026-11-11', '00:15:00'))).toBe('12:15 AM');
    expect(formatTimestampTime12h(at('2026-11-11', '12:00:00'))).toBe('12:00 PM');
  });

  it('returns null for missing or unparseable input', () => {
    expect(formatTimestampTime12h(null)).toBeNull();
    expect(formatTimestampTime12h('not a date')).toBeNull();
  });
});

describe('formatTimestampRange', () => {
  it('joins start and end', () => {
    expect(formatTimestampRange(at('2026-11-11', '10:30:00'), at('2026-11-11', '11:30:00'))).toBe(
      '10:30 AM - 11:30 AM',
    );
  });

  it('falls back to the start alone when there is no end', () => {
    expect(formatTimestampRange(at('2026-11-11', '10:30:00'), null)).toBe('10:30 AM');
  });

  it('is null when there is no start', () => {
    expect(formatTimestampRange(null, at('2026-11-11', '11:30:00'))).toBeNull();
  });
});

describe('matchesUniversityFilter', () => {
  it('lets everything through the Todas filter, including unmarked universities', () => {
    expect(matchesUniversityFilter(null, 'all')).toBe(true);
    expect(matchesUniversityFilter('favorite', 'all')).toBe(true);
  });

  it('separates Favoritas from Interesadas', () => {
    expect(matchesUniversityFilter('favorite', 'favorite')).toBe(true);
    expect(matchesUniversityFilter('interested', 'favorite')).toBe(false);
    expect(matchesUniversityFilter('interested', 'interested')).toBe(true);
    expect(matchesUniversityFilter(null, 'interested')).toBe(false);
  });
});

describe('sortByRank', () => {
  const row = (university_id: string, rank: number | null, created_at = '2026-01-01') => ({
    university_id,
    interest_level: 'favorite' as const,
    rank,
    created_at,
  });

  it('orders by rank ascending', () => {
    expect(sortByRank([row('c', 3), row('a', 1), row('b', 2)]).map((r) => r.university_id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('sorts unranked rows last', () => {
    expect(sortByRank([row('none', null), row('first', 1)]).map((r) => r.university_id)).toEqual([
      'first',
      'none',
    ]);
  });

  it('breaks duplicate ranks by created_at, then id, so the order is total', () => {
    const rows = [row('z', 1, '2026-02-01'), row('a', 1, '2026-01-01'), row('m', 1, '2026-01-01')];
    expect(sortByRank(rows).map((r) => r.university_id)).toEqual(['a', 'm', 'z']);
  });

  it('does not mutate its input', () => {
    const rows = [row('b', 2), row('a', 1)];
    sortByRank(rows);
    expect(rows.map((r) => r.university_id)).toEqual(['b', 'a']);
  });
});

describe('renumberRanks', () => {
  it('returns only the rows whose rank actually moved', () => {
    expect(
      renumberRanks([
        { university_id: 'a', rank: 1 },
        { university_id: 'c', rank: 3 },
        { university_id: 'b', rank: 2 },
      ]),
    ).toEqual([
      { university_id: 'c', rank: 2 },
      { university_id: 'b', rank: 3 },
    ]);
  });

  it('assigns ranks to a previously unranked list', () => {
    expect(
      renumberRanks([
        { university_id: 'a', rank: null },
        { university_id: 'b', rank: null },
      ]),
    ).toEqual([
      { university_id: 'a', rank: 1 },
      { university_id: 'b', rank: 2 },
    ]);
  });

  it('writes nothing when the list is already dense and in order', () => {
    expect(
      renumberRanks([
        { university_id: 'a', rank: 1 },
        { university_id: 'b', rank: 2 },
      ]),
    ).toEqual([]);
  });
});

describe('moveItem', () => {
  const list = ['a', 'b', 'c', 'd'];

  it('moves an item down', () => {
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item up', () => {
    expect(moveItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('is a no-op for an unchanged or out-of-range index', () => {
    expect(moveItem(list, 1, 1)).toBe(list);
    expect(moveItem(list, -1, 2)).toBe(list);
    expect(moveItem(list, 0, 9)).toBe(list);
  });

  it('does not mutate its input', () => {
    const input = [...list];
    moveItem(input, 0, 2);
    expect(input).toEqual(list);
  });
});

describe('computeEventSummary', () => {
  const agenda = [
    agendaItem({ id: 'w', kind: 'workshop' }),
    agendaItem({ id: 'm1', kind: 'meeting' }),
    agendaItem({ id: 'm2', kind: 'meeting' }),
  ];

  it('counts approved sessions by kind and de-duplicates noted universities', () => {
    const summary = computeEventSummary({
      universityCount: 8,
      notedUniversityIds: ['u1', 'u2', 'u1'],
      favoriteCount: 3,
      agenda,
    });
    expect(summary.universitiesNoted).toBe(2);
    expect(summary.meetingsAttended).toBe(2);
    expect(summary.workshopsAttended).toBe(1);
    expect(summary.coverage).toBeCloseTo(0.25);
  });

  it('does not count sessions that were never approved as attended', () => {
    const summary = computeEventSummary({
      universityCount: 1,
      notedUniversityIds: [],
      favoriteCount: 0,
      agenda: [agendaItem({ id: 'p', kind: 'meeting', status: 'pending' })],
    });
    expect(summary.meetingsAttended).toBe(0);
  });

  it('reports zero coverage rather than dividing by zero for an event with no universities', () => {
    const summary = computeEventSummary({
      universityCount: 0,
      notedUniversityIds: [],
      favoriteCount: 0,
      agenda: [],
    });
    expect(summary.coverage).toBe(0);
  });
});

describe('countByStatus', () => {
  it('counts each request status for the tab labels', () => {
    expect(
      countByStatus([
        { status: 'pending' },
        { status: 'pending' },
        { status: 'approved' },
        { status: 'rejected' },
      ]),
    ).toEqual({ pending: 2, approved: 1, rejected: 1 });
  });

  it('reports zeros for an empty list', () => {
    expect(countByStatus([])).toEqual({ pending: 0, approved: 0, rejected: 0 });
  });
});
