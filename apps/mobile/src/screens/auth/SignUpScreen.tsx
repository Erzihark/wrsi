import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSupabase } from '@wrsi/api';
import { Screen, Text, Input, Button } from '@wrsi/ui';

export function SignUpScreen() {
  const supabase = useSupabase();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert(t('common.error'), error.message);
    // On success the auth state changes and the root navigator routes onward.
  }

  return (
    <Screen>
      <Text variant="heading">{t('auth.signUp')}</Text>
      <Input
        label={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={t('auth.signUp')} loading={loading} onPress={handleSignUp} />
    </Screen>
  );
}
