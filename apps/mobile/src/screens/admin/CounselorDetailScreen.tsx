import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useCounselor,
  useCreateEntity,
  useDeleteEntity,
  useUpdateCounselor,
  type CounselorUpdate,
} from '@wrsi/api';
import { Input } from '@wrsi/ui';
import type { CounselorsStackParamList } from '../../navigation/types';
import { EntityDetailScreen, type SetField } from './EntityDetailScreen';

// `type` (not `interface`) so it satisfies `Form extends Record<string, unknown>`.
type FormState = {
  first_name: string;
  last_name: string;
  phone: string;
};

const EMPTY_FORM: FormState = { first_name: '', last_name: '', phone: '' };

export function CounselorDetailScreen() {
  const { t } = useTranslation();
  const { id } = useRoute<RouteProp<CounselorsStackParamList, 'Detail'>>().params;
  const mode = id ? 'edit' : 'create';

  const record = useCounselor(id);
  const create = useCreateEntity('counselor');
  const update = useUpdateCounselor(id ?? '');
  const remove = useDeleteEntity('counselor');

  const initialForm: FormState | undefined = record.data
    ? {
        first_name: record.data.first_name,
        last_name: record.data.last_name,
        phone: record.data.phone ?? '',
      }
    : undefined;

  function validate(form: FormState): string | null {
    if (!form.first_name.trim() || !form.last_name.trim()) return t('validation.required');
    return null;
  }

  function toPayload(form: FormState): CounselorUpdate {
    return {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
    };
  }

  function renderFields(form: FormState, set: SetField<FormState>) {
    return (
      <>
        <Input
          label={t('onboarding.firstName')}
          value={form.first_name}
          onChangeText={(v) => set('first_name', v)}
        />
        <Input
          label={t('onboarding.lastName')}
          value={form.last_name}
          onChangeText={(v) => set('last_name', v)}
        />
        <Input
          label={t('admin.phone')}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => set('phone', v)}
        />
      </>
    );
  }

  return (
    <EntityDetailScreen
      mode={mode}
      title={mode === 'create' ? t('admin.addCounselor') : t('admin.editCounselor')}
      emptyForm={EMPTY_FORM}
      initialForm={initialForm}
      optionsReady
      validate={validate}
      toPayload={toPayload}
      create={create}
      update={update}
      remove={remove}
      entityId={id}
      renderFields={renderFields}
    />
  );
}
