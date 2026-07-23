import { useTranslation } from 'react-i18next';
import {
  useMyStudentProfile,
  useMyUniversityInterests,
  useSetUniversityInterest,
} from '@wrsi/api';
import { Button, HeartIcon } from '@wrsi/ui';

/**
 * Save/unsave toggle for a university in the general directory. Self-contained
 * (reads the current student + saved set from cache) so it drops into both the
 * list and detail screens. Saving notifies the WX team via the existing trigger.
 *
 * Interest now has two levels (Interesada / Favorita — see the event screens),
 * but the directory keeps a single save action: this button saves at the
 * *Interesada* level and clears the row entirely when unsaving. Promoting to
 * Favorita, and the ranking that comes with it, happens where the ranking is
 * built. Unsaving a Favorita from here therefore also drops it out of the
 * ranking, which is the honest reading of "I'm no longer interested".
 */
export function SaveUniversityButton({ universityId }: { universityId: string }) {
  const { t } = useTranslation();
  const profile = useMyStudentProfile();
  const interests = useMyUniversityInterests();
  const setInterest = useSetUniversityInterest();

  const studentId = profile.data?.id;
  const saved = interests.data?.byId.has(universityId) ?? false;

  return (
    <Button
      variant={saved ? 'primary' : 'secondary'}
      title={saved ? t('universities.saved') : t('universities.save')}
      icon={(color) => <HeartIcon filled={saved} color={color} />}
      loading={setInterest.isPending}
      disabled={!studentId}
      onPress={() => {
        if (studentId) {
          setInterest.mutate({
            studentId,
            universityId,
            level: saved ? null : 'interested',
          });
        }
      }}
    />
  );
}
