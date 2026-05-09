import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { createInstance, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/src/i18n/resources/en.json';
import am from '@/src/i18n/resources/am.json';

const STORAGE_KEY = 'guardian.language';
export const i18n = createInstance();

const resources: Resource = {
  en: { translation: en },
  am: { translation: am },
};

function resolveDeviceLanguage() {
  const preferred = Localization.getLocales?.()?.[0]?.languageCode ?? 'en';
  return preferred === 'am' ? 'am' : 'en';
}

export async function setAppLanguage(lang: 'en' | 'am') {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export async function initI18n() {
  if (i18n.isInitialized) return;

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const lang = stored === 'am' || stored === 'en' ? stored : resolveDeviceLanguage();
  if (lang !== i18n.language) {
    await i18n.changeLanguage(lang);
  }
}

