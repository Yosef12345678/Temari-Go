import { ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { NAV_THEME } from '@/lib/theme';
import { AppProviders } from '@/src/hooks/AppProviders';
import { useAuth } from '@/src/hooks/useAuth';
import { useMe } from '@/src/hooks/useMe';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { registerPushTokenOncePerBoot } from '@/src/utils/push/registerPushToken';
import { PortalHost } from '@rn-primitives/portal';
import { initI18n } from '@/src/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const router = useRouter();
  const segments = useSegments() as unknown as string[];
  const { session } = useAuth();
  const meQuery = useMe();

  const hasSegments = segments.length > 0;
  const inAuthGroup = segments[0] === '(auth)';

  // While restoring session or fetching /users/me, show a lightweight spinner.
  const isBusy =
    !hasSegments ||
    session.status === 'unknown' ||
    (session.status === 'authenticated' && (meQuery.isLoading || meQuery.isFetching));

  useEffect(() => {
    if (!hasSegments || session.status === 'unknown') return;

    if (session.status === 'unauthenticated') {
      if (!inAuthGroup) router.replace('/(auth)/login' as any);
      return;
    }

    // authenticated
    // Best-effort device registration (push token)
    void registerPushTokenOncePerBoot();

    // Do not enforce profile completion: if user is on auth routes, send to home.
    // Keep other authenticated routes accessible (e.g. /billing/pay, /children/[id]).
    if (inAuthGroup) router.replace('/(tabs)/children' as any);
  }, [hasSegments, session.status, inAuthGroup, router]);

  if (isBusy) {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', zIndex: 9999 }}>
        <ActivityIndicator />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const activeTheme = colorScheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    void initI18n();
  }, []);

  return (
    <AppProviders>
      <ThemeProvider value={NAV_THEME[activeTheme]}>
        <AuthGate />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="modals/payment-webview" options={{ presentation: 'modal', title: 'Payment' }} />
          <Stack.Screen name="modals/helpdesk" options={{ presentation: 'modal', title: 'Help Desk' }} />
          <Stack.Screen name="modals/live-chat" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
        <PortalHost />
      </ThemeProvider>
    </AppProviders>
  );
}
