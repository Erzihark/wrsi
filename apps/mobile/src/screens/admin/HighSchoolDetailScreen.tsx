import { View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useCountries,
  useCreateEntity,
  useCurrencies,
  useDeleteEntity,
  useEducationModels,
  useHighSchool,
  useStatesProvinces,
  useStatuses,
  useUpdateHighSchool,
  type HighSchoolUpdate,
} from '@wrsi/api';
import { Input, Select, useTheme } from '@wrsi/ui';
import type { HighSchoolsStackParamList } from '../../navigation/types';
import { CountryStateSelect } from '../../components/CountryStateSelect';
import { EntityDetailScreen, type SetField } from './EntityDetailScreen';

// `type` (not `interface`) so it satisfies `Form extends Record<string, unknown>`.
type FormState = {
  name: string;
  contact_first_name: string;
  contact_last_name: string;
  phone_number: string;
  monthly_cost: string;
  monthly_cost_currency_id: string | null;
  education_model_id: string | null;
  state_province_id: string | null;
  status_id: string | null;
}

const EMPTY_FORM: FormState = {
  name: '',
  contact_first_name: '',
  contact_last_name: '',
  phone_number: '',
  monthly_cost: '',
  monthly_cost_currency_id: null,
  education_model_id: null,
  state_province_id: null,
  status_id: null,
};

export function HighSchoolDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useRoute<RouteProp<HighSchoolsStackParamList, 'Detail'>>().params;
  const mode = id ? 'edit' : 'create';

  const record = useHighSchool(id);
  const create = useCreateEntity('high_school');
  const update = useUpdateHighSchool(id ?? '');
  const remove = useDeleteEntity('high_school');
  const countries = useCountries();
  const currencies = useCurrencies();
  const models = useEducationModels();
  const states = useStatesProvinces();
  const statuses = useStatuses('high_school');

  const optionsReady = Boolean(
    countries.data && currencies.data && models.data && states.data && statuses.data,
  );

  const initialForm: FormState | undefined = record.data
    ? {
        name: record.data.name,
        contact_first_name: record.data.contact_first_name ?? '',
        contact_last_name: record.data.contact_last_name ?? '',
        phone_number: record.data.phone_number ?? '',
        monthly_cost:
          record.data.monthly_cost != null ? String(record.data.monthly_cost) : '',
        monthly_cost_currency_id: record.data.monthly_cost_currency_id,
        education_model_id: record.data.education_model_id,
        state_province_id: record.data.state_province_id,
        status_id: record.data.status_id,
      }
    : undefined;

  const currencyOptions = (currencies.data ?? []).map((c) => ({ label: c.code, value: c.id }));
  const modelOptions = (models.data ?? []).map((m) => ({ label: m.name, value: m.id }));
  const statusOptions = (statuses.data ?? []).map((s) => ({ label: s.name, value: s.id }));

  function validate(form: FormState): string | null {
    if (!form.name.trim()) return t('validation.required');
    return null;
  }

  function toPayload(form: FormState): HighSchoolUpdate {
    return {
      name: form.name.trim(),
      contact_first_name: form.contact_first_name.trim() || null,
      contact_last_name: form.contact_last_name.trim() || null,
      phone_number: form.phone_number.trim() || null,
      monthly_cost: form.monthly_cost ? Number(form.monthly_cost) : null,
      monthly_cost_currency_id: form.monthly_cost_currency_id,
      education_model_id: form.education_model_id,
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
          label={t('admin.contactFirstName')}
          value={form.contact_first_name}
          onChangeText={(v) => set('contact_first_name', v)}
        />
        <Input
          label={t('admin.contactLastName')}
          value={form.contact_last_name}
          onChangeText={(v) => set('contact_last_name', v)}
        />
        <Input
          label={t('admin.phone')}
          keyboardType="phone-pad"
          value={form.phone_number}
          onChangeText={(v) => set('phone_number', v)}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 2 }}>
            <Input
              label={t('admin.monthlyCost')}
              keyboardType="numeric"
              value={form.monthly_cost}
              onChangeText={(v) => set('monthly_cost', v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label={t('onboarding.currency')}
              options={currencyOptions}
              value={form.monthly_cost_currency_id}
              onChange={(v) => set('monthly_cost_currency_id', v)}
            />
          </View>
        </View>
        <Select
          label={t('admin.educationModel')}
          options={modelOptions}
          value={form.education_model_id}
          onChange={(v) => set('education_model_id', v)}
        />
        <CountryStateSelect
          countries={countries.data ?? []}
          states={states.data ?? []}
          value={form.state_province_id}
          onChange={(v) => set('state_province_id', v)}
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
      title={mode === 'create' ? t('admin.addHighSchool') : t('admin.editHighSchool')}
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
