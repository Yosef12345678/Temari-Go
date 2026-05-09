import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotifications, markNotificationRead } from '@/api/notifications';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DriverNotification } from '@/types/notification';

export default function AlertsScreen() {
  const [items, setItems] = useState<DriverNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'operational' | 'safety'>('all');

  async function load() {
    const next = await getNotifications();
    setItems(next);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(item: DriverNotification) {
    await markNotificationRead(item.id);
    await load();
  }

  const filtered = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'safety') return ['alcohol_alert', 'speed_violation', 'critical_motion_alert', 'sos_alert'].includes(item.type);
    return ['attendance', 'attendance_issue', 'parent_absence', 'boarding', 'exiting', 'missed_bus'].some((k) => item.type.includes(k));
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ThemedText style={styles.title}>Communication & Alerts</ThemedText>
      <ScrollView horizontal contentContainerStyle={styles.filters}>
        <Button label="All" variant={filter === 'all' ? 'default' : 'outline'} onPress={() => setFilter('all')} />
        <Button label="Operational" variant={filter === 'operational' ? 'default' : 'outline'} onPress={() => setFilter('operational')} />
        <Button label="Safety" variant={filter === 'safety' ? 'default' : 'outline'} onPress={() => setFilter('safety')} />
      </ScrollView>
      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((item) => (
          <Card key={item.id} style={[styles.card, !item.read && styles.unread]}>
            <ThemedText style={styles.type}>{item.type}</ThemedText>
            <ThemedText>{item.message}</ThemedText>
            {!item.read ? (
              <Button onPress={() => markRead(item)} label="Mark read" />
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  content: { gap: 8, paddingBottom: 20 },
  filters: { gap: 8, paddingVertical: 8 },
  card: { gap: 6 },
  unread: { borderLeftColor: '#1a73e8', borderLeftWidth: 4 },
  type: { fontWeight: '700', textTransform: 'capitalize' },
});
