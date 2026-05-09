import MapView, { Marker, Polyline } from 'react-native-maps';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { acceptJob, arriveJob, completeJob, getMyJobs, pickupJob } from '@/api/driver';
import { subscribeRealtime, type RealtimeSnapshot } from '@/api/realtime';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session-context';
import type { DriverJob } from '@/types/driver';

const STATUS_COLOR: Record<string, string> = {
  online: '#1b9e3f',
  offline: '#b3261e',
  degraded: '#d97706',
};

export default function RouteScreen() {
  const theme = useTheme();
  const { signOut } = useSession();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<DriverJob | null>(null);
  const [sync, setSync] = useState<RealtimeSnapshot | null>(null);

  async function refresh() {
    const jobs = await getMyJobs('active');
    setJob(jobs[0] ?? null);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const unsubscribe = subscribeRealtime(setSync);
    return unsubscribe;
  }, []);

  const coordinates = useMemo(
    () =>
      (job?.route_stops_eta ?? [])
        .map((stop) => ({
          latitude: Number(stop.pickup_latitude),
          longitude: Number(stop.pickup_longitude),
        }))
        .filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude)),
    [job?.route_stops_eta]
  );

  async function transition(action: 'accept' | 'arrive' | 'pickup' | 'complete') {
    if (!job) return;
    if (action === 'accept') await acceptJob(job.id);
    if (action === 'arrive') await arriveJob(job.id);
    if (action === 'pickup') await pickupJob(job.id);
    if (action === 'complete') await completeJob(job.id);
    await refresh();
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Route Execution</ThemedText>
        <Button label="Logout" variant="outline" onPress={signOut} />
      </View>
      <ThemedText style={[styles.sync, { color: STATUS_COLOR[sync?.status ?? 'degraded'] }]}>
        Sync: {sync?.status ?? 'degraded'} {sync ? `- unread ${sync.unreadCount}` : ''}
      </ThemedText>
      {!job ? (
        <ThemedText style={styles.empty}>No active route assigned.</ThemedText>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.routeName}>{job.name}</ThemedText>
          <ThemedText>Job status: {job.lifecycle_status}</ThemedText>
          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: coordinates[0]?.latitude ?? 9.03,
                longitude: coordinates[0]?.longitude ?? 38.74,
                latitudeDelta: 0.25,
                longitudeDelta: 0.25,
              }}
            >
              {coordinates.map((coord, idx) => (
                <Marker key={`${coord.latitude}-${coord.longitude}-${idx}`} coordinate={coord} />
              ))}
              {coordinates.length > 1 ? <Polyline coordinates={coordinates} strokeWidth={4} strokeColor={theme.tint} /> : null}
            </MapView>
          </View>
          <ThemedText style={styles.section}>Stop ETAs</ThemedText>
          {(job.route_stops_eta ?? []).map((stop) => (
            <Card key={stop.assignment_id} style={styles.row}>
              <ThemedText style={styles.rowText}>{stop.student_name ?? `Student ${stop.student_id}`}</ThemedText>
              <ThemedText style={styles.rowText}>{stop.eta_minutes} min</ThemedText>
            </Card>
          ))}
          <View style={styles.actions}>
            <Button style={styles.button} onPress={() => transition('accept')} label="Accept" />
            <Button style={styles.button} onPress={() => transition('arrive')} label="Arrive" />
            <Button style={styles.button} onPress={() => transition('pickup')} label="Pickup" />
            <Button style={styles.button} onPress={() => transition('complete')} label="Complete" />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  link: { color: '#1a73e8', fontWeight: '600' },
  sync: { marginTop: 6, marginBottom: 8, fontWeight: '600' },
  empty: { marginTop: 20 },
  content: { gap: 10, paddingBottom: 20 },
  routeName: { fontWeight: '700', fontSize: 18 },
  mapWrap: { height: 220, borderRadius: 12, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  section: { marginTop: 8, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minWidth: 90 },
});
