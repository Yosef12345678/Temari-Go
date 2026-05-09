import MapView, { Marker, Polyline } from 'react-native-maps';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { acceptJob, arriveJob, completeJob, getMyJobs, pickupJob } from '@/api/driver';
import { subscribeRealtime, type RealtimeSnapshot } from '@/api/realtime';
import { AppBrand } from '@/components/app-brand';
import {
  RouteActionPanel,
  RouteHero,
  RouteStats,
  SectionHeader,
  StopEtaCard,
} from '@/components/driver/route-home-components';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session-context';
import type { DriverJob } from '@/types/driver';

const isNativeMapAvailable =
  Platform.OS !== 'web' &&
  (UIManager.getViewManagerConfig?.('AIRMap') || UIManager.getViewManagerConfig?.('AIRGoogleMap'));

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
        <AppBrand compact subtitle="Driver console" />
        <Button label="Logout" variant="outline" onPress={signOut} />
      </View>
      {!job ? (
        <View style={styles.emptyWrap}>
          <RouteHero job={null} syncStatus={sync?.status ?? 'degraded'} unreadCount={sync?.unreadCount} />
          <Card style={styles.emptyCard}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>No active route assigned</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              You are all set. New route assignments, operational notices, and safety alerts will appear here as soon as dispatch sends them.
            </ThemedText>
          </Card>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <RouteHero job={job} syncStatus={sync?.status ?? 'degraded'} unreadCount={sync?.unreadCount} />
          <RouteStats job={job} />
          <Card style={styles.mapCard}>
            <SectionHeader title="Live route map" detail={`${coordinates.length} mapped stops`} />
            {isNativeMapAvailable ? (
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
            ) : (
              <View style={styles.mapFallback}>
                <ThemedText type="smallBold">Map preview unavailable</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  The current app build does not include the native maps module. Route stops are still listed below.
                </ThemedText>
              </View>
            )}
          </Card>
          <SectionHeader title="Stop ETAs" detail="Pickup order" />
          {(job.route_stops_eta ?? []).map((stop) => (
            <StopEtaCard
              key={stop.assignment_id}
              index={stop.pickup_order ?? 0}
              name={stop.student_name ?? `Student ${stop.student_id}`}
              etaMinutes={stop.eta_minutes}
            />
          ))}
          <RouteActionPanel status={job.lifecycle_status} onTransition={transition} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: Spacing.three, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.two, marginBottom: Spacing.three },
  emptyWrap: { gap: Spacing.three },
  emptyCard: { padding: Spacing.four, borderRadius: 22 },
  emptyTitle: { fontSize: 24, lineHeight: 30 },
  emptyText: { fontSize: 15, lineHeight: 23 },
  content: { gap: Spacing.three, paddingBottom: Spacing.four },
  mapCard: { gap: Spacing.three, padding: Spacing.three },
  mapWrap: { height: 240, borderRadius: 18, overflow: 'hidden' },
  mapFallback: { minHeight: 160, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.three, backgroundColor: '#e2e8f0' },
  map: { width: '100%', height: '100%' },
});
