import { Redirect, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Bell, ClipboardCheck, Route, ShieldAlert, UserRound } from 'lucide-react-native';

import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session-context';
import { registerPushTokenOncePerBoot } from '@/utils/push/registerPushToken';

export default function DriverAppLayout() {
  const theme = useTheme();
  const { t } = useI18n();
  const { status, bootstrapComplete } = useSession();

  useEffect(() => {
    void registerPushTokenOncePerBoot();
  }, []);

  if (!bootstrapComplete || status === 'unknown') return null;
  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen name="route" options={{ title: t('route'), tabBarIcon: ({ color, size }) => <Route color={color} size={size} /> }} />
      <Tabs.Screen name="attendance" options={{ title: t('attendance'), tabBarIcon: ({ color, size }) => <ClipboardCheck color={color} size={size} /> }} />
      <Tabs.Screen name="alerts" options={{ title: t('alerts'), tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }} />
      <Tabs.Screen name="safety" options={{ title: t('safety'), tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('profile'), tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
