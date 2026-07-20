import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { es } from './locales/es';

export const defaultNS = 'translation';

export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

export type AppLanguage = keyof typeof resources;

/**
 * Makes `t('some.key')` a compile-time error when the key doesn't exist in
 * `en`/`es` (both locales share one shape — see the `docs-coverage`-style
 * assumption enforced by `locales.test.ts`). Without this, a typo'd key like
 * `onboarding.intendedLevels` silently renders the raw key string on-device
 * instead of failing `yarn typecheck`.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}

/** Initialize i18next once. `lng` typically comes from expo-localization. */
export function initI18n(lng: string = 'es') {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: 'es',
      defaultNS,
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

/** Localized month names (January-first) for date pickers. */
export const monthNames: Record<AppLanguage, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
};

/** Month names for the active (or given) language, defaulting to Spanish. */
export function getMonthNames(lng?: string): string[] {
  const key = (lng ?? i18n.language ?? 'es').slice(0, 2) as AppLanguage;
  return monthNames[key] ?? monthNames.es;
}

export default i18n;
export { en, es };
export type { TranslationResource } from './locales/en';
