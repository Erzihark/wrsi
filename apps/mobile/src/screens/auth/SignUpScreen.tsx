import { useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useSupabase } from '@wrsi/api';
import { emailField } from '@wrsi/shared-utils';
import { Screen, Text, Button } from '@wrsi/ui';
import { FormInput } from '../../components/form';

const schema = z.object({
  email: emailField(),
  password: z.string().min(6, 'validation.passwordMin'),
});
type FormState = z.infer<typeof schema>;

export function SignUpScreen() {
  const supabase = useSupabase();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormState>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = async ({ email, password }: FormState) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert(t('common.error'), error.message);
    // On success the auth state changes and the root navigator routes onward.
  };

  return (
    <Screen>
      <Text variant="heading">{t('auth.signUp')}</Text>
      <FormInput
        control={form.control}
        name="email"
        label={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <FormInput
        control={form.control}
        name="password"
        label={t('auth.password')}
        secureTextEntry
      />
      <Button
        title={t('auth.signUp')}
        loading={loading}
        disabled={!form.formState.isValid || loading}
        onPress={form.handleSubmit(onSubmit)}
      />
    </Screen>
  );
}
