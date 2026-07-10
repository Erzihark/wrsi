import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  useCounselor,
  useCountries,
  useCreateEntity,
  useDeleteEntity,
  useUpdateCounselor,
  type CounselorUpdate,
} from '@wrsi/api';
import {
  emptyPhone,
  parsePhone,
  phoneFieldOptional,
  requiredString,
  type PhoneValue,
} from '@wrsi/shared-utils';
import type { Control } from 'react-hook-form';
import type { CounselorsStackParamList } from '../../navigation/types';
import { FormInput, FormPhoneField } from '../../components/form';
import { EntityDetailScreen } from './EntityDetailScreen';

const schema = z.object({
  first_name: requiredString(),
  last_name: requiredString(),
  phone: phoneFieldOptional(),
});
// `type` (not `interface`) so it satisfies `Form extends Record<string, unknown>`.
type FormState = z.infer<typeof schema>;

const EMPTY_FORM: FormState = { first_name: '', last_name: '', phone: emptyPhone() };

export function CounselorDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useRoute<RouteProp<CounselorsStackParamList, 'Detail'>>().params;
  const mode = id ? 'edit' : 'create';

  const record = useCounselor(id);
  const countries = useCountries();
  const create = useCreateEntity('counselor');
  const update = useUpdateCounselor(id ?? '');
  const remove = useDeleteEntity('counselor');

  const isoToId = (iso: string) =>
    countries.data?.find((c) => c.iso_code === iso)?.id ?? null;

  const initialForm: FormState | undefined = record.data
    ? {
        first_name: record.data.first_name,
        last_name: record.data.last_name,
        phone: parsePhone(record.data.phone, isoToId),
      }
    : undefined;

  function toPayload(form: FormState): CounselorUpdate {
    return {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.e164,
    };
  }

  function renderFields(control: Control<FormState>) {
    return (
      <>
        <FormInput control={control} name="first_name" label={t('onboarding.firstName')} />
        <FormInput control={control} name="last_name" label={t('onboarding.lastName')} />
        <FormPhoneField
          control={control}
          name="phone"
          label={t('admin.phone')}
          countries={countries.data ?? []}
          spanish={i18n.language.startsWith('es')}
          placeholder={t('admin.phone')}
          countryPickerTitle={t('onboarding.phoneCountry')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
      </>
    );
  }

  return (
    <EntityDetailScreen
      mode={mode}
      title={mode === 'create' ? t('admin.addCounselor') : t('admin.editCounselor')}
      schema={schema}
      emptyForm={EMPTY_FORM}
      initialForm={initialForm}
      optionsReady={Boolean(countries.data)}
      toPayload={toPayload}
      create={create}
      update={update}
      remove={remove}
      entityId={id}
      renderFields={renderFields}
    />
  );
}
