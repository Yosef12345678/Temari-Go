import { translations, type TranslationKey } from '@/i18n/translations';
import { usePreferences } from '@/state/preferences-context';

export function useI18n() {
  const { language } = usePreferences();

  function t(key: TranslationKey, vars?: Record<string, string | number>) {
    let text = (translations[language][key] ?? translations.en[key]) as string;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return text;
  }

  return { t, language };
}
