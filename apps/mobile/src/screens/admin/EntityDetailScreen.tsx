import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, type Control, type DefaultValues, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { emailField } from '@wrsi/shared-utils';
import { Button, Screen, Text, useConfirm, useTheme, useToast } from '@wrsi/ui';
import { FormInput } from '../../components/form';

/** A mutation-like object (matches TanStack `useMutation` results). */
interface Mutation<TArgs, TResult = unknown> {
  mutateAsync: (args: TArgs) => Promise<TResult>;
  isPending: boolean;
}

/** Login credentials collected when provisioning a new entity account. */
const credentialsSchema = z.object({
  email: emailField(),
  // Optional: blank = server generates one. If typed, enforce a sane minimum.
  password: z
    .string()
    .refine((v) => v.length === 0 || v.length >= 6, 'validation.passwordMin'),
});
type Credentials = z.infer<typeof credentialsSchema>;

export interface EntityDetailScreenProps<
  Form extends Record<string, unknown>,
  Payload extends Record<string, unknown>,
> {
  mode: 'create' | 'edit';
  /** Screen heading. */
  title: string;
  /** zod schema validating the form (drives real-time errors + submit gating). */
  schema: z.ZodType<unknown, z.ZodTypeDef, Form>;
  /** Blank form used in create mode / as default values. */
  emptyForm: Form;
  /** Edit mode: the loaded record mapped to a form, or `undefined` while loading. */
  initialForm?: Form;
  /** Whether every lookup this form needs has loaded. */
  optionsReady: boolean;
  /** Map the form to the entity's profile columns (used for both create + update). */
  toPayload: (form: Form) => Payload;
  /** `useCreateEntity(type)` result (create mode). */
  create: Mutation<{ email: string; password?: string; profile: Record<string, unknown> }, { password: string }>;
  /** The entity's update mutation (edit mode). */
  update: Mutation<Payload>;
  /** `useDeleteEntity(type)` result (edit mode). */
  remove: Mutation<string>;
  /** The record id (edit mode) — required to update/delete. */
  entityId?: string;
  /** Entity-specific field inputs, bound to the form via `control`. */
  renderFields: (control: Control<Form>) => ReactNode;
}

/**
 * Shared scaffold for the admin create/edit/delete screens. Owns a
 * react-hook-form instance (validated by the entity's zod `schema`), the
 * loading gate, the create-vs-edit save branch, and the delete-with-confirm
 * flow, so each entity only supplies its fields + payload mapping. Submit is
 * disabled until the form (and, in create mode, the credentials) are valid.
 * Create/delete go through Edge Functions (they provision/remove the backing
 * auth user); update is a direct RLS-guarded write.
 */
export function EntityDetailScreen<
  Form extends Record<string, unknown>,
  Payload extends Record<string, unknown>,
>({
  mode,
  title,
  schema,
  emptyForm,
  initialForm,
  optionsReady,
  toPayload,
  create,
  update,
  remove,
  entityId,
  renderFields,
}: EntityDetailScreenProps<Form, Payload>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation();
  const toast = useToast();
  const confirm = useConfirm();

  const form = useForm<Form>({
    resolver: zodResolver(schema) as Resolver<Form>,
    defaultValues: emptyForm as DefaultValues<Form>,
    mode: 'onTouched',
  });
  const creds = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  // Edit mode: seed the form once the record loads, then compute validity so the
  // submit button reflects whether the existing data passes the schema. Guarded
  // by a ref because `initialForm` is rebuilt every render (mapped from the
  // query data) — without this, reset would fire on every keystroke and wipe edits.
  const seeded = useRef(false);
  useEffect(() => {
    if (mode === 'edit' && initialForm && !seeded.current) {
      seeded.current = true;
      form.reset(initialForm as DefaultValues<Form>);
      void form.trigger();
    }
  }, [mode, initialForm, form]);

  if (!optionsReady || (mode === 'edit' && !initialForm)) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const onSubmit = async (values: Form) => {
    try {
      if (mode === 'create') {
        const { email, password } = creds.getValues();
        const result = await create.mutateAsync({
          email: email.trim(),
          password: password.trim() || undefined,
          profile: toPayload(values),
        });
        // Surface the (possibly generated) password in a blocking alert — a toast
        // would auto-dismiss before the admin can read/copy the credentials.
        Alert.alert(
          t('admin.created'),
          t('admin.credentials', { email: email.trim(), password: result.password }),
        );
        nav.goBack();
      } else {
        await update.mutateAsync(toPayload(values));
        toast.show({ type: 'success', message: t('admin.saved') });
        nav.goBack();
      }
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  };

  async function save() {
    // In create mode both forms must pass; handleSubmit re-validates the profile.
    if (mode === 'create' && !(await creds.trigger())) return;
    await form.handleSubmit(onSubmit)();
  }

  async function confirmRemove() {
    if (!entityId) return;
    const ok = await confirm.confirm({
      title: t('admin.deleteTitle'),
      message: t('admin.confirmDelete'),
      confirmText: t('admin.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(entityId);
      toast.show({ type: 'success', message: t('admin.deleted') });
      nav.goBack();
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  const submitting = create.isPending || update.isPending;
  const canSubmit =
    form.formState.isValid && (mode === 'edit' || creds.formState.isValid) && !submitting;

  return (
    <Screen scroll>
      <Text variant="heading">{title}</Text>

      {mode === 'create' && (
        <>
          <FormInput
            control={creds.control}
            name="email"
            label={t('admin.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="entity-email-input"
          />
          <FormInput
            control={creds.control}
            name="password"
            label={t('admin.tempPassword')}
            autoCapitalize="none"
          />
        </>
      )}

      {renderFields(form.control)}

      <Button
        title={submitting ? t('onboarding.submitting') : mode === 'create' ? t('admin.create') : t('admin.saveChanges')}
        loading={submitting}
        disabled={!canSubmit}
        onPress={save}
        testID="entity-submit"
      />

      {mode === 'edit' && (
        <Button
          variant="danger"
          title={t('admin.delete')}
          loading={remove.isPending}
          onPress={confirmRemove}
          style={{ marginTop: theme.spacing.sm }}
        />
      )}
    </Screen>
  );
}
