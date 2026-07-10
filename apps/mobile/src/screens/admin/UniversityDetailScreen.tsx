import { type RouteProp, useRoute } from '@react-navigation/native';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  useCountries,
  useCreateEntity,
  useCurrencies,
  useDeleteEntity,
  useStatesProvinces,
  useStatuses,
  useUniversity,
  useUpdateUniversity,
  type UniversityUpdate,
} from '@wrsi/api';
import { imageUrlField, requiredString, webUrlField } from '@wrsi/shared-utils';
import type { UniversitiesStackParamList } from '../../navigation/types';
import { CountryStateSelect } from '../../components/CountryStateSelect';
import { FormInput, FormSelect } from '../../components/form';
import { EntityDetailScreen } from './EntityDetailScreen';

const schema = z.object({
  name: requiredString(),
  website: webUrlField(),
  description: z.string(),
  requirements: z.string(),
  logo_url: imageUrlField(),
  currency_id: z.string().nullable(),
  state_province_id: z.string().nullable(),
  status_id: z.string().nullable(),
});
// `type` (not `interface`) so it satisfies `Form extends Record<string, unknown>`.
type FormState = z.infer<typeof schema>;

const EMPTY_FORM: FormState = {
  name: '',
  website: '',
  description: '',
  requirements: '',
  logo_url: '',
  currency_id: null,
  state_province_id: null,
  status_id: null,
};

export function UniversityDetailScreen() {
  const { t } = useTranslation();
  const { id } = useRoute<RouteProp<UniversitiesStackParamList, 'Detail'>>().params;
  const mode = id ? 'edit' : 'create';

  const record = useUniversity(id);
  const create = useCreateEntity('university');
  const update = useUpdateUniversity(id ?? '');
  const remove = useDeleteEntity('university');
  const countries = useCountries();
  const currencies = useCurrencies();
  const states = useStatesProvinces();
  const statuses = useStatuses('university');

  const optionsReady = Boolean(
    countries.data && currencies.data && states.data && statuses.data,
  );

  const initialForm: FormState | undefined = record.data
    ? {
        name: record.data.name,
        website: record.data.website ?? '',
        description: record.data.description ?? '',
        requirements: record.data.requirements ?? '',
        logo_url: record.data.logo_url ?? '',
        currency_id: record.data.currency_id,
        state_province_id: record.data.state_province_id,
        status_id: record.data.status_id,
      }
    : undefined;

  const currencyOptions = (currencies.data ?? []).map((c) => ({ label: c.code, value: c.id }));
  const statusOptions = (statuses.data ?? []).map((s) => ({ label: s.name, value: s.id }));

  function toPayload(form: FormState): UniversityUpdate {
    return {
      name: form.name.trim(),
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      requirements: form.requirements.trim() || null,
      logo_url: form.logo_url.trim() || null,
      currency_id: form.currency_id,
      state_province_id: form.state_province_id,
      status_id: form.status_id,
    };
  }

  function renderFields(control: Control<FormState>) {
    return (
      <>
        <FormInput control={control} name="name" label={t('admin.name')} />
        <FormInput
          control={control}
          name="website"
          label={t('admin.website')}
          keyboardType="url"
          autoCapitalize="none"
        />
        <FormInput control={control} name="description" label={t('admin.description')} multiline />
        <FormInput
          control={control}
          name="requirements"
          label={t('admin.requirements')}
          multiline
        />
        <FormInput
          control={control}
          name="logo_url"
          label={t('admin.logoUrl')}
          autoCapitalize="none"
        />
        <FormSelect control={control} name="currency_id" label={t('onboarding.currency')} options={currencyOptions} />
        <Controller
          control={control}
          name="state_province_id"
          render={({ field }) => (
            <CountryStateSelect
              countries={countries.data ?? []}
              states={states.data ?? []}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FormSelect control={control} name="status_id" label={t('admin.status')} options={statusOptions} />
      </>
    );
  }

  return (
    <EntityDetailScreen
      mode={mode}
      title={mode === 'create' ? t('admin.addUniversity') : t('admin.editUniversity')}
      schema={schema}
      emptyForm={EMPTY_FORM}
      initialForm={initialForm}
      optionsReady={optionsReady}
      toPayload={toPayload}
      create={create}
      update={update}
      remove={remove}
      entityId={id}
      renderFields={renderFields}
    />
  );
}
