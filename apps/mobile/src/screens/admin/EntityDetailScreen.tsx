import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Screen, Text, useConfirm, useTheme, useToast } from '@wrsi/ui';

/** A mutation-like object (matches TanStack `useMutation` results). */
interface Mutation<TArgs, TResult = unknown> {
  mutateAsync: (args: TArgs) => Promise<TResult>;
  isPending: boolean;
}

export type SetField<Form> = <K extends keyof Form>(key: K, value: Form[K]) => void;

export interface EntityDetailScreenProps<
  Form extends Record<string, unknown>,
  Payload extends Record<string, unknown>,
> {
  mode: 'create' | 'edit';
  /** Screen heading. */
  title: string;
  /** Blank form used in create mode. */
  emptyForm: Form;
  /** Edit mode: the loaded record mapped to a form, or `undefined` while loading. */
  initialForm?: Form;
  /** Whether every lookup this form needs has loaded. */
  optionsReady: boolean;
  /** Return an error message to block submit, or `null` when valid. */
  validate?: (form: Form) => string | null;
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
  /** Entity-specific field inputs. */
  renderFields: (form: Form, set: SetField<Form>) => ReactNode;
}

/**
 * Shared scaffold for the admin create/edit/delete screens. Owns the form state,
 * the loading gate, the create-vs-edit save branch, and the delete-with-confirm
 * flow, so each entity only supplies its fields + payload mapping. Create/delete
 * go through Edge Functions (they provision/remove the backing auth user); update
 * is a direct RLS-guarded write.
 */
export function EntityDetailScreen<
  Form extends Record<string, unknown>,
  Payload extends Record<string, unknown>,
>({
  mode,
  title,
  emptyForm,
  initialForm,
  optionsReady,
  validate,
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

  const [form, setForm] = useState<Form | null>(mode === 'create' ? emptyForm : null);
  // Login credentials for the provisioned account (create mode only).
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (mode === 'edit' && initialForm && !form) setForm(initialForm);
  }, [mode, initialForm, form]);

  const ready = optionsReady && form;
  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const set: SetField<Form> = (key, value) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  async function save() {
    if (!form) return;
    const validationError = validate?.(form);
    if (validationError) {
      toast.show({ type: 'error', message: validationError });
      return;
    }
    try {
      if (mode === 'create') {
        if (!email.trim()) {
          toast.show({ type: 'error', message: t('admin.emailRequired') });
          return;
        }
        const result = await create.mutateAsync({
          email: email.trim(),
          password: password.trim() || undefined,
          profile: toPayload(form),
        });
        // Surface the (possibly generated) password in a blocking alert — a toast
        // would auto-dismiss before the admin can read/copy the credentials.
        Alert.alert(
          t('admin.created'),
          t('admin.credentials', { email: email.trim(), password: result.password }),
        );
        nav.goBack();
      } else {
        await update.mutateAsync(toPayload(form));
        toast.show({ type: 'success', message: t('admin.saved') });
        nav.goBack();
      }
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
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

  return (
    <Screen scroll>
      <Text variant="heading">{title}</Text>

      {mode === 'create' && (
        <>
          <Input
            label={t('admin.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label={t('admin.tempPassword')}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}

      {renderFields(form, set)}

      <Button
        title={submitting ? t('onboarding.submitting') : mode === 'create' ? t('admin.create') : t('admin.saveChanges')}
        loading={submitting}
        onPress={save}
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
