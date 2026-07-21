import { useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { optionalEmailField, requiredString } from '@wrsi/shared-utils';
import {
  useCreateSponsor,
  useDeleteSponsor,
  useIndustries,
  useSponsor,
  useStatuses,
  useUpdateSponsor,
  type SponsorInsert,
} from '@wrsi/api';
import { Button, Screen, Text, useConfirm, useTheme, useToast } from '@wrsi/ui';
import type { SponsorsStackParamList } from '../../navigation/types';
import { FormInput, FormSelect } from '../../components/form';

const schema = z.object({
  name: requiredString(),
  email: optionalEmailField(),
  industry_id: z.string().nullable(),
  status_id: z.string().nullable(),
  login_username: z.string(),
  login_password: z.string(),
  links: z.string(),
});
type FormState = z.infer<typeof schema>;

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  industry_id: null,
  status_id: null,
  login_username: '',
  login_password: '',
  links: '',
};

export function SponsorDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation();
  const toast = useToast();
  const confirm = useConfirm();
  const { id } = useRoute<RouteProp<SponsorsStackParamList, 'Detail'>>().params;
  const mode = id ? 'edit' : 'create';

  const record = useSponsor(id);
  const industries = useIndustries();
  const statuses = useStatuses('sponsor');
  const create = useCreateSponsor();
  const update = useUpdateSponsor(id ?? '');
  const remove = useDeleteSponsor();

  const form = useForm<FormState>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
    mode: 'onTouched',
  });

  // Seed once when the record loads. Guarded by a ref so a later refetch (e.g.
  // refetch-on-focus giving a new data reference) can't reset the form and wipe
  // edits in progress. Mirrors EventDetailScreen.
  const seeded = useRef(false);
  const loaded = mode === 'edit' ? record.data : null;
  useEffect(() => {
    if (loaded && !seeded.current) {
      seeded.current = true;
      form.reset({
        name: loaded.name,
        email: loaded.email ?? '',
        industry_id: loaded.industry_id,
        status_id: loaded.status_id,
        login_username: loaded.login_username ?? '',
        login_password: loaded.login_password ?? '',
        links: loaded.links ?? '',
      });
      void form.trigger();
    }
  }, [loaded, form]);

  const industryOptions = (industries.data ?? []).map((i) => ({ label: i.name, value: i.id }));
  const statusOptions = (statuses.data ?? []).map((s) => ({ label: s.name, value: s.id }));

  const ready =
    Boolean(industries.data && statuses.data) && (mode === 'create' || record.data);
  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  function toPayload(f: FormState): SponsorInsert {
    return {
      name: f.name.trim(),
      email: f.email.trim() || null,
      industry_id: f.industry_id,
      status_id: f.status_id,
      login_username: f.login_username.trim() || null,
      login_password: f.login_password.trim() || null,
      links: f.links.trim() || null,
    };
  }

  const onSubmit = async (values: FormState) => {
    try {
      if (mode === 'create') {
        await create.mutateAsync(toPayload(values));
        toast.show({ type: 'success', message: t('admin.created') });
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

  async function confirmRemove() {
    if (!id) return;
    const ok = await confirm.confirm({
      title: t('admin.deleteTitle'),
      message: t('admin.confirmDelete'),
      confirmText: t('admin.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(id);
      toast.show({ type: 'success', message: t('admin.deleted') });
      nav.goBack();
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  const submitting = create.isPending || update.isPending;
  const control: Control<FormState> = form.control;

  return (
    <Screen scroll>
      <Text variant="heading">{mode === 'create' ? t('admin.addSponsor') : t('admin.editSponsor')}</Text>

      <FormInput control={control} name="name" label={t('admin.name')} testID="sponsor-name-input" />
      <FormInput
        control={control}
        name="email"
        label={t('admin.email')}
        keyboardType="email-address"
        autoCapitalize="none"
        testID="sponsor-email-input"
      />
      <FormSelect
        control={control}
        name="industry_id"
        label={t('admin.industry')}
        options={industryOptions}
      />
      <FormSelect control={control} name="status_id" label={t('admin.status')} options={statusOptions} />
      <FormInput
        control={control}
        name="login_username"
        label={t('admin.loginUsername')}
        autoCapitalize="none"
        testID="sponsor-login-username-input"
      />
      <FormInput
        control={control}
        name="login_password"
        label={t('admin.loginPassword')}
        autoCapitalize="none"
        secureTextEntry
      />
      <FormInput control={control} name="links" label={t('admin.links')} multiline />

      <Button
        title={submitting ? t('onboarding.submitting') : mode === 'create' ? t('admin.create') : t('admin.saveChanges')}
        loading={submitting}
        disabled={!form.formState.isValid || submitting}
        onPress={form.handleSubmit(onSubmit)}
        testID="entity-submit"
      />

      {mode === 'edit' && (
        <Button
          variant="danger"
          title={t('admin.delete')}
          loading={remove.isPending}
          onPress={confirmRemove}
          style={{ marginTop: theme.spacing.sm }}
          testID="entity-delete"
        />
      )}
    </Screen>
  );
}
