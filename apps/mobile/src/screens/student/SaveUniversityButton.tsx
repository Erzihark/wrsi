import { useTranslation } from 'react-i18next';
import {
  useMyStudentProfile,
  useMyUniversityInterests,
  useToggleUniversityInterest,
} from '@wrsi/api';
import { Button, HeartIcon } from '@wrsi/ui';

/**
 * Save/unsave toggle for a university. Self-contained (reads the current
 * student + saved set from cache) so it drops into both the list and detail
 * screens. Saving a university notifies the WX team via the existing trigger.
 */
export function SaveUniversityButton({ universityId }: { universityId: string }) {
  const { t } = useTranslation();
  const profile = useMyStudentProfile();
  const interests = useMyUniversityInterests();
  const toggle = useToggleUniversityInterest();

  const studentId = profile.data?.id;
  const saved = interests.data?.has(universityId) ?? false;

  return (
    <Button
      variant={saved ? 'primary' : 'secondary'}
      title={saved ? t('universities.saved') : t('universities.save')}
      icon={(color) => <HeartIcon filled={saved} color={color} />}
      loading={toggle.isPending}
      disabled={!studentId}
      onPress={() => {
        if (studentId) toggle.mutate({ studentId, universityId, saved });
      }}
    />
  );
}
