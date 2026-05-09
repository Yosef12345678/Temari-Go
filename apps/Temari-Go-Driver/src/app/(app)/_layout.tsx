import { Redirect, Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { useSession } from '@/state/session-context';
import { registerPushTokenOncePerBoot } from '@/utils/push/registerPushToken';

export default function DriverAppLayout() {
  const { status, bootstrapComplete } = useSession();

  useEffect(() => {
    void registerPushTokenOncePerBoot();
  }, []);

  if (!bootstrapComplete || status === 'unknown') return null;
  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="route" options={{ title: 'Route' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="safety" options={{ title: 'Safety' }} />
    </Tabs>
  );
}
