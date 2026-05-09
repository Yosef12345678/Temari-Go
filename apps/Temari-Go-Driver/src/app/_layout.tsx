import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { SessionProvider } from '@/state/session-context';
import { PreferencesProvider, usePreferences } from '@/state/preferences-context';

export default function TabLayout() {
  return (
    <PreferencesProvider>
      <AppRoot />
    </PreferencesProvider>
  );
}

function AppRoot() {
  const { resolvedTheme, bootstrapComplete } = usePreferences();

  if (!bootstrapComplete) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <SessionProvider>
      <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SessionProvider>
  );
}
