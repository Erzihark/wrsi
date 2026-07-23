import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useSupabase } from '@wrsi/api';
import { emailField, requiredString } from '@wrsi/shared-utils';
import { Screen, Text, Button } from '@wrsi/ui';
import type { AuthStackParamList } from '../../navigation/types';
import { FormInput } from '../../components/form';

const schema = z.object({ email: emailField(), password: requiredString() });
type FormState = z.infer<typeof schema>;

export function LoginScreen() {
  const supabase = useSupabase();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormState>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = async ({ email, password }: FormState) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert(t('common.error'), error.message);
  };

  return (
    <Screen>
      <Text variant="heading">{t('auth.login')}</Text>
      <FormInput
        control={form.control}
        name="email"
        testID="login-email"
        label={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <FormInput
        control={form.control}
        name="password"
        testID="login-password"
        label={t('auth.password')}
        secureTextEntry
      />
      <Button
        testID="login-submit"
        title={t('auth.login')}
        loading={loading}
        disabled={!form.formState.isValid || loading}
        onPress={form.handleSubmit(onSubmit)}
      />
      <Button
        variant="ghost"
        title={t('auth.noAccount')}
        onPress={() => navigation.navigate('SignUp')}
      />
    </Screen>
  );
}
