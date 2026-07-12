import { View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
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
import {
  emptyPhone,
  numericField,
  parsePhone,
  phoneFieldOptional,
  requiredString,
} from '@wrsi/shared-utils';
import { useTheme } from '@wrsi/ui';
import type { HighSchoolsStackParamList } from '../../navigation/types';
import { CountryStateSelect } from '../../components/CountryStateSelect';
import { FormInput, FormPhoneField, FormSelect } from '../../components/form';
import { EntityDetailScreen } from './EntityDetailScreen';

const schema = z.object({
  name: requiredString(),
  contact_first_name: z.string(),
  contact_last_name: z.string(),
  phone: phoneFieldOptional(),
  monthly_cost: numericField({ min: 0 }, 'validation.amountInvalid'),
  monthly_cost_currency_id: z.string().nullable(),
  education_model_id: z.string().nullable(),
  state_province_id: z.string().nullable(),
  status_id: z.string().nullable(),
});
// `type` (not `interface`) so it satisfies `Form extends Record<string, unknown>`.
type FormState = z.infer<typeof schema>;

const EMPTY_FORM: FormState = {
  name: '',
  contact_first_name: '',
  contact_last_name: '',
  phone: emptyPhone(),
  monthly_cost: '',
  monthly_cost_currency_id: null,
  education_model_id: null,
  state_province_id: null,
  status_id: null,
};

export function HighSchoolDetailScreen() {
  const { t, i18n } = useTranslation();
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

  const isoToId = (iso: string) =>
    countries.data?.find((c) => c.iso_code === iso)?.id ?? null;

  const initialForm: FormState | undefined = record.data
    ? {
        name: record.data.name,
        contact_first_name: record.data.contact_first_name ?? '',
        contact_last_name: record.data.contact_last_name ?? '',
        phone: parsePhone(record.data.phone_number, isoToId),
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

  function toPayload(form: FormState): HighSchoolUpdate {
    return {
      name: form.name.trim(),
      contact_first_name: form.contact_first_name.trim() || null,
      contact_last_name: form.contact_last_name.trim() || null,
      phone_number: form.phone.e164,
      monthly_cost: form.monthly_cost ? Number(form.monthly_cost) : null,
      monthly_cost_currency_id: form.monthly_cost_currency_id,
      education_model_id: form.education_model_id,
      state_province_id: form.state_province_id,
      status_id: form.status_id,
    };
  }

  function renderFields(control: Control<FormState>) {
    return (
      <>
        <FormInput control={control} name="name" label={t('admin.name')} testID="highschool-name-input" />
        <FormInput control={control} name="contact_first_name" label={t('admin.contactFirstName')} testID="highschool-contact-first-input" />
        <FormInput control={control} name="contact_last_name" label={t('admin.contactLastName')} />
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
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 2 }}>
            <FormInput
              control={control}
              name="monthly_cost"
              label={t('admin.monthlyCost')}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormSelect
              control={control}
              name="monthly_cost_currency_id"
              label={t('onboarding.currency')}
              options={currencyOptions}
            />
          </View>
        </View>
        <FormSelect
          control={control}
          name="education_model_id"
          label={t('admin.educationModel')}
          options={modelOptions}
        />
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
      title={mode === 'create' ? t('admin.addHighSchool') : t('admin.editHighSchool')}
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
