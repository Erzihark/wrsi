import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createWrsiClient, type WrsiClient } from '@wrsi/api';
import { env } from '../config/env';

// Persist the auth session in the device secure enclave / keystore.
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase: WrsiClient = createWrsiClient({
  url: env.supabaseUrl,
  anonKey: env.supabaseAnonKey,
  storage: secureStorage,
});
