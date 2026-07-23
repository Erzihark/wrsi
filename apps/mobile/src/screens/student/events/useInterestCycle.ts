import { useCallback } from 'react';
import {
  type InterestLevel,
  useMyStudentProfile,
  useMyUniversityInterests,
  useSetUniversityInterest,
} from '@wrsi/api';
import { useToast } from '@wrsi/ui';

/**
 * The ☆/★ control's behavior, shared by the participating-universities list and
 * the university sheet.
 *
 * One tap cycles **none → Interesada → Favorita → none**. A single control for
 * both levels is the comp's own model (the list has one star per row, filled or
 * outlined), and it avoids putting two competing buttons on a 360px row.
 *
 * Promoting to Favorita appends to the end of the ranking rather than the top:
 * `nextRank` is the student's current highest rank + 1, so starring a new
 * university never silently demotes one they deliberately placed first.
 */
export function useInterestCycle() {
  const profile = useMyStudentProfile();
  const interests = useMyUniversityInterests();
  const setInterest = useSetUniversityInterest();
  const toast = useToast();

  const studentId = profile.data?.id;
  const byId = interests.data?.byId;

  const levelFor = useCallback(
    (universityId: string): InterestLevel | null => byId?.get(universityId)?.interest_level ?? null,
    [byId],
  );

  const cycle = useCallback(
    async (universityId: string) => {
      if (!studentId) return;
      const current = levelFor(universityId);
      const next: InterestLevel | null =
        current === null ? 'interested' : current === 'interested' ? 'favorite' : null;

      const highestRank = (interests.data?.rows ?? []).reduce(
        (max, row) => (row.rank != null && row.rank > max ? row.rank : max),
        0,
      );

      try {
        await setInterest.mutateAsync({
          studentId,
          universityId,
          level: next,
          nextRank: highestRank + 1,
        });
      } catch (err) {
        toast.show({ type: 'error', message: (err as Error).message });
      }
    },
    [studentId, levelFor, interests.data, setInterest, toast],
  );

  return { levelFor, cycle, isPending: setInterest.isPending, ready: Boolean(studentId) };
}
