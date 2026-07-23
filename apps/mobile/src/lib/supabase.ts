import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { SupportedStorage } from '@supabase/supabase-js';
import { createWrsiClient, type WrsiClient } from '@wrsi/api';
import { env } from '../config/env';

// Persist the auth session in the device secure enclave / keystore.
const secureStorage: SupportedStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

/**
 * `expo-secure-store` ships no web implementation: on web every call throws
 * `ExpoSecureStore.default.getValueWithKeyAsync is not a function`, which leaves
 * Supabase's `getSession()` unresolved and pins the app on its loading spinner
 * forever — no screen ever renders. Web is the local design-preview target
 * (`yarn workspace @wrsi/mobile web`, see docs/DESIGN.md), so it falls back to
 * localStorage to get past that.
 *
 * This is deliberately *only* good enough for a dev preview. localStorage is
 * readable by any XSS on the origin, unlike the keystore — if web ever becomes
 * a real shipping surface, this needs revisiting rather than inheriting.
 */
const webStorage: SupportedStorage = {
  getItem: (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
  removeItem: (key: string) => globalThis.localStorage?.removeItem(key),
};

export const supabase: WrsiClient = createWrsiClient({
  url: env.supabaseUrl,
  anonKey: env.supabaseAnonKey,
  storage: Platform.OS === 'web' ? webStorage : secureStorage,
});
