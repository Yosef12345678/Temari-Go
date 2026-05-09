import { translations, type TranslationKey } from '@/i18n/translations';
import { usePreferences } from '@/state/preferences-context';

export function useI18n() {
  const { language } = usePreferences();

  function t(key: TranslationKey) {
    return translations[language][key] ?? translations.en[key];
  }

  return { t, language };
}
