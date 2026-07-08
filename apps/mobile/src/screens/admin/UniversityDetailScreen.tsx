import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useCreateEntity,
  useCurrencies,
  useDeleteEntity,
  useStatesProvinces,
  useStatuses,
  useUniversity,
  useUpdateUniversity,
  type UniversityUpdate,
} from '@wrsi/api';
import { Input, SearchSelect, Select } from '@wrsi/ui';
import type { UniversitiesStackParamList } from '../../navigation/types';
import { EntityDetailScreen, type SetField } from './EntityDetailScreen';

// `type` (not `interface`) so it satisfies `Form extends Record<string, unknown>`.
type FormState = {
  name: string;
  website: string;
  description: string;
  requirements: string;
  logo_url: string;
  currency_id: string | null;
  state_province_id: string | null;
  status_id: string | null;
}

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
  const currencies = useCurrencies();
  const states = useStatesProvinces();
  const statuses = useStatuses('university');

  const optionsReady = Boolean(currencies.data && states.data && statuses.data);

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
  const stateOptions = (states.data ?? []).map((s) => ({ label: s.name, value: s.id }));
  const statusOptions = (statuses.data ?? []).map((s) => ({ label: s.name, value: s.id }));

  function validate(form: FormState): string | null {
    if (!form.name.trim()) return t('validation.required');
    return null;
  }

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

  function renderFields(form: FormState, set: SetField<FormState>) {
    return (
      <>
        <Input
          label={t('admin.name')}
          value={form.name}
          onChangeText={(v) => set('name', v)}
        />
        <Input
          label={t('admin.website')}
          keyboardType="url"
          autoCapitalize="none"
          value={form.website}
          onChangeText={(v) => set('website', v)}
        />
        <Input
          label={t('admin.description')}
          multiline
          value={form.description}
          onChangeText={(v) => set('description', v)}
        />
        <Input
          label={t('admin.requirements')}
          multiline
          value={form.requirements}
          onChangeText={(v) => set('requirements', v)}
        />
        <Input
          label={t('admin.logoUrl')}
          autoCapitalize="none"
          value={form.logo_url}
          onChangeText={(v) => set('logo_url', v)}
        />
        <Select
          label={t('onboarding.currency')}
          options={currencyOptions}
          value={form.currency_id}
          onChange={(v) => set('currency_id', v)}
        />
        <SearchSelect
          label={t('admin.state')}
          options={stateOptions}
          value={form.state_province_id}
          onChange={(v) => set('state_province_id', v)}
          placeholder={t('picker.select')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <Select
          label={t('admin.status')}
          options={statusOptions}
          value={form.status_id}
          onChange={(v) => set('status_id', v)}
        />
      </>
    );
  }

  return (
    <EntityDetailScreen
      mode={mode}
      title={mode === 'create' ? t('admin.addUniversity') : t('admin.editUniversity')}
      emptyForm={EMPTY_FORM}
      initialForm={initialForm}
      optionsReady={optionsReady}
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
