import { Tabs } from 'expo-router';
import React from 'react';
import { BellRing, BusFront, UserRound, WalletCards } from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useResolvedColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const theme = useResolvedColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="children/index"
        options={{
          title: 'Children',
          tabBarIcon: ({ color }) => <BusFront size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <BellRing size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing/index"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color }) => <WalletCards size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserRound size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
