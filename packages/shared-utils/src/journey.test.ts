import { describe, expect, it } from 'vitest';
import { computeJourneyProgress, type JourneyStatus } from './journey';

// Mirrors the 7 seeded student lifecycle stages.
const statuses: JourneyStatus[] = [
  { id: 's1', name: 'Registered', sort_order: 1 },
  { id: 's2', name: 'Onboarding', sort_order: 2 },
  { id: 's3', name: 'Documentation Pending', sort_order: 3 },
  { id: 's4', name: 'University Selection', sort_order: 4 },
  { id: 's5', name: 'Application Submitted', sort_order: 5 },
  { id: 's6', name: 'Accepted', sort_order: 6 },
  { id: 's7', name: 'Enrolled', sort_order: 7 },
];

describe('computeJourneyProgress', () => {
  it('computes percent, next step, and remaining for a mid-journey status', () => {
    expect(computeJourneyProgress(statuses, 's3')).toEqual({
      percent: 43, // 3/7
      currentIndex: 2,
      currentName: 'Documentation Pending',
      nextName: 'University Selection',
      remaining: 4,
      total: 7,
    });
  });

  it('handles the terminal status (100%, no next step)', () => {
    const result = computeJourneyProgress(statuses, 's7');
    expect(result).toMatchObject({ percent: 100, nextName: null, remaining: 0 });
  });

  it('handles no current status: 0%, next = first stage, all steps remaining', () => {
    const result = computeJourneyProgress(statuses, null);
    expect(result).toEqual({
      percent: 0,
      currentIndex: -1,
      currentName: null,
      nextName: 'Registered',
      remaining: 7,
      total: 7,
    });
  });

  it('handles an unknown status id like no status', () => {
    expect(computeJourneyProgress(statuses, 'nope').currentIndex).toBe(-1);
  });

  it('sorts by sort_order regardless of input order and tolerates empty lists', () => {
    const shuffled = [statuses[2]!, statuses[0]!, statuses[1]!];
    expect(computeJourneyProgress(shuffled, 's1')).toMatchObject({
      currentIndex: 0,
      nextName: 'Onboarding',
      percent: 33,
    });
    expect(computeJourneyProgress([], 's1')).toMatchObject({ percent: 0, total: 0, nextName: null });
  });
});
