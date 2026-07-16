import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  DateField,
  type DateFieldProps,
  Input,
  type InputProps,
  MultiSelect,
  type MultiSelectProps,
  type Option,
  PhoneField,
  type PhoneFieldProps,
  SearchMultiSelect,
  type SearchMultiSelectProps,
  SearchSelect,
  type SearchSelectProps,
  Select,
  type SelectProps,
  TimeField,
  type TimeFieldProps,
} from '@wrsi/ui';
import type { PhoneValue } from '@wrsi/shared-utils';

/**
 * react-hook-form–bound wrappers around the `@wrsi/ui` primitives. These are the
 * standard way to build a validated field: pass `control` + `name`, and the
 * wrapper handles the `Controller` binding and translating the schema's i18n
 * error key. See `docs/VALIDATION.md`.
 */

/** Shared `control` + `name` props every wrapper takes. */
interface Bound<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

/** Translate a zod message (which is an i18n key) for display. */
function useErr() {
  const { t } = useTranslation();
  return (message?: string) => (message ? t(message) : undefined);
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  ...rest
}: Bound<T> & Omit<InputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormSelect<T extends FieldValues, V extends string | number>({
  control,
  name,
  options,
  label,
}: Bound<T> & Pick<SelectProps<V>, 'options' | 'label'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Select<V>
          label={label}
          options={options}
          value={(field.value as V | null) ?? null}
          onChange={field.onChange}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormSearchSelect<T extends FieldValues, V extends string | number>({
  control,
  name,
  ...rest
}: Bound<T> & Omit<SearchSelectProps<V>, 'value' | 'onChange' | 'error'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SearchSelect<V>
          {...rest}
          value={(field.value as V | null) ?? null}
          onChange={field.onChange}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormMultiSelect<T extends FieldValues, V extends string | number>({
  control,
  name,
  options,
  label,
}: Bound<T> & Pick<MultiSelectProps<V>, 'options' | 'label'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <MultiSelect<V>
          label={label}
          options={options}
          values={(field.value as V[] | undefined) ?? []}
          onChange={field.onChange}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormSearchMultiSelect<T extends FieldValues, V extends string | number>({
  control,
  name,
  ...rest
}: Bound<T> & Omit<SearchMultiSelectProps<V>, 'values' | 'onChange' | 'error'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SearchMultiSelect<V>
          {...rest}
          values={(field.value as V[] | undefined) ?? []}
          onChange={field.onChange}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormDateField<T extends FieldValues>({
  control,
  name,
  ...rest
}: Bound<T> & Omit<DateFieldProps, 'value' | 'onChange' | 'error'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormTimeField<T extends FieldValues>({
  control,
  name,
  ...rest
}: Bound<T> & Omit<TimeFieldProps, 'value' | 'onChange' | 'error'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TimeField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormPhoneField<T extends FieldValues>({
  control,
  name,
  ...rest
}: Bound<T> & Omit<PhoneFieldProps, 'value' | 'onChange' | 'error'>) {
  const err = useErr();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PhoneField
          {...rest}
          value={field.value as PhoneValue}
          onChange={field.onChange}
          error={err(fieldState.error?.message)}
        />
      )}
    />
  );
}
