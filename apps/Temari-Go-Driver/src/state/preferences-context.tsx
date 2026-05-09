import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'en' | 'am';

type PreferencesContextValue = {
  bootstrapComplete: boolean;
  themePreference: ThemePreference;
  language: LanguagePreference;
  resolvedTheme: 'light' | 'dark';
  theme: typeof Colors.light | typeof Colors.dark;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  setLanguage: (language: LanguagePreference) => Promise<void>;
};

const THEME_KEY = 'driver.preference.theme';
const LANGUAGE_KEY = 'driver.preference.language';
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isLanguagePreference(value: string | null): value is LanguagePreference {
  return value === 'en' || value === 'am';
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [bootstrapComplete, setBootstrapComplete] = useState(false);
  const [themePreferenceState, setThemePreferenceState] = useState<ThemePreference>('system');
  const [languageState, setLanguageState] = useState<LanguagePreference>('en');

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(LANGUAGE_KEY)])
      .then(([themeValue, languageValue]) => {
        if (isThemePreference(themeValue)) setThemePreferenceState(themeValue);
        if (isLanguagePreference(languageValue)) setLanguageState(languageValue);
      })
      .finally(() => setBootstrapComplete(true));
  }, []);

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    await AsyncStorage.setItem(THEME_KEY, preference);
  }, []);

  const setLanguage = useCallback(async (language: LanguagePreference) => {
    setLanguageState(language);
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  }, []);

  const resolvedTheme = themePreferenceState === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePreferenceState;

  const value = useMemo<PreferencesContextValue>(
    () => ({
      bootstrapComplete,
      themePreference: themePreferenceState,
      language: languageState,
      resolvedTheme,
      theme: Colors[resolvedTheme],
      setThemePreference,
      setLanguage,
    }),
    [bootstrapComplete, languageState, resolvedTheme, setLanguage, setThemePreference, themePreferenceState]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider.');
  }
  return context;
}
