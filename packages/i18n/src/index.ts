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

export default i18n;
export { en, es };
export type { TranslationResource } from './locales/en';
