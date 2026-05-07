import React, { useMemo, useRef } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Clock3, LocateFixed, Route } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useBusCurrent, useBusHistory } from '@/src/hooks/useLocations';
import { useStudentDetail } from '@/src/hooks/useStudents';

export default function ChildTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const student = useStudentDetail(String(id ?? ''));
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const errorColor = useThemeColor({}, 'destructive');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const mapRef = useRef<MapView | null>(null);

  const busId = useMemo(() => {
    const s: any = student.data?.student;
    return String(s?.busId ?? s?.bus_id ?? '');
  }, [student.data]);

  const current = useBusCurrent(busId, { refetchIntervalMs: 8_000 });
  const history = useBusHistory(busId, { limit: 40 });
  const studentData = (student.data?.student ?? {}) as Record<string, unknown>;

  const homeCoords =
    typeof studentData.home_latitude === 'number' && typeof studentData.home_longitude === 'number'
      ? { latitude: studentData.home_latitude, longitude: studentData.home_longitude }
      : null;

  const routePoints = useMemo(() => {
    return (history.data ?? [])
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      .map((point) => ({ latitude: point.latitude, longitude: point.longitude }));
  }, [history.data]);

  const mapRegion = useMemo(() => {
    if (current.data?.latitude && current.data?.longitude) {
      return {
        latitude: current.data.latitude,
        longitude: current.data.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    if (homeCoords) {
      return { ...homeCoords, latitudeDelta: 0.03, longitudeDelta: 0.03 };
    }
    return { latitude: 9.03, longitude: 38.74, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [current.data?.latitude, current.data?.longitude, homeCoords]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Live Tracking' }} />
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={student.isRefetching || current.isRefetching || history.isRefetching}
            onRefresh={() => {
              void student.refetch();
              if (busId) {
                void current.refetch();
                void history.refetch();
              }
            }}
          />
        }>
        {!busId ? <ThemedText>No bus assigned for this student.</ThemedText> : null}
        {busId ? (
          <Card style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
            <CardHeader style={styles.headerRow}>
              <CardTitle>Live Route</CardTitle>
              <Badge variant="secondary">
                <ThemedText>Bus {busId}</ThemedText>
              </Badge>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock3 color={iconColor} size={14} />
                  <ThemedText style={{ color: mutedText }}>
                    {current.data ? `Updated ${formatTimestamp(String(current.data.timestamp ?? ''))}` : 'Waiting for live location'}
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <Route color={iconColor} size={14} />
                  <ThemedText style={{ color: mutedText }}>{routePoints.length} points</ThemedText>
                </View>
              </View>

              <View style={[styles.mapContainer, { borderColor }]}>
                <MapView ref={mapRef} style={styles.map} initialRegion={mapRegion}>
                  {routePoints.length > 1 ? <Polyline coordinates={routePoints} strokeColor={tint} strokeWidth={3} /> : null}
                  {homeCoords ? <Marker coordinate={homeCoords} title="Home" pinColor="#22c55e" /> : null}
                  {current.data?.latitude && current.data?.longitude ? (
                    <Marker
                      coordinate={{ latitude: current.data.latitude, longitude: current.data.longitude }}
                      title={`Bus ${busId}`}
                      description="Live location"
                      pinColor={tint}
                    />
                  ) : null}
                </MapView>
              </View>

              <Pressable
                accessibilityRole="button"
                style={[styles.recenterBtn, { borderColor }]}
                onPress={() => mapRef.current?.animateToRegion(mapRegion, 400)}>
                <LocateFixed color={iconColor} size={16} />
                <ThemedText type="defaultSemiBold">Recenter</ThemedText>
              </Pressable>

              {current.error ? (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>{(current.error as any)?.message ?? 'Failed'}</ThemedText>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  scrollBody: { gap: 12, paddingBottom: 24 },
  card: { borderWidth: 1, borderRadius: 14, paddingVertical: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardContent: { padding: 14, gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recenterBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapContainer: { overflow: 'hidden', borderRadius: 12, borderWidth: 1 },
  map: { width: '100%', height: 280 },
  errorText: { fontSize: 14 },
});

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
