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

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const router = useRouter();
  const segments = useSegments() as unknown as string[];
  const { session } = useAuth();
  const meQuery = useMe();

  const inAuthGroup = segments[0] === '(auth)';
  const inTabsGroup = segments[0] === '(tabs)';

  // While restoring session or fetching /users/me, show a lightweight spinner.
  const isBusy = session.status === 'unknown' || (session.status === 'authenticated' && (meQuery.isLoading || meQuery.isFetching));

  useEffect(() => {
    if (session.status === 'unknown') return;

    if (session.status === 'unauthenticated') {
      if (!inAuthGroup) router.replace('/(auth)/login' as any);
      return;
    }

    // authenticated
    // Best-effort device registration (push token)
    void registerPushTokenOncePerBoot();

    // Do not enforce profile completion: if logged in, go to home.
    if (!inTabsGroup) router.replace('/(tabs)/children' as any);
  }, [session.status, inAuthGroup, inTabsGroup, router]);

  if (isBusy) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const activeTheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <AppProviders>
      <ThemeProvider value={NAV_THEME[activeTheme]}>
        <AuthGate />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="modals/payment-webview" options={{ presentation: 'modal', title: 'Payment' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
        <PortalHost />
      </ThemeProvider>
    </AppProviders>
  );
}
