import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSupabase } from '@wrsi/api';
import { Screen, Text, Input, Button } from '@wrsi/ui';
import type { AuthStackParamList } from '../../navigation/types';

export function LoginScreen() {
  const supabase = useSupabase();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert(t('common.error'), error.message);
  }

  return (
    <Screen>
      <Text variant="heading">WX Study</Text>
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
      <Button title={t('auth.login')} loading={loading} onPress={handleLogin} />
      <Button
        variant="ghost"
        title={t('auth.noAccount')}
        onPress={() => navigation.navigate('SignUp')}
      />
    </Screen>
  );
}
