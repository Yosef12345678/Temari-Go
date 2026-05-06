import React, { useMemo, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardContent } from '@/components/ui/card';
import { useBusHistory } from '@/src/hooks/useLocations';
import { useStudentDetail } from '@/src/hooks/useStudents';
import { useBusCurrent } from '@/src/hooks/useLocations';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChildTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const student = useStudentDetail(String(id ?? ''));
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
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
        <ThemedText type="title">Bus tracking</ThemedText>

        {!busId ? <ThemedText>No bus assigned for this student.</ThemedText> : null}
        {busId ? (
          <Card style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
            <CardContent style={styles.cardContent}>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Bus: {busId}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.recenterBtn, { borderColor }]}
                  onPress={() => {
                    mapRef.current?.animateToRegion(mapRegion, 400);
                  }}>
                  <ThemedText>Recenter</ThemedText>
                </Pressable>
              </View>

              <View style={styles.mapContainer}>
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

              {current.isLoading || history.isLoading ? <ThemedText>Loading live map…</ThemedText> : null}
              {!current.data && !current.isLoading ? <ThemedText>Live location is not available yet.</ThemedText> : null}
              {current.data ? (
                <ThemedText>Last updated: {formatTimestamp(String(current.data.timestamp ?? ''))}</ThemedText>
              ) : null}
              {current.data?.speed != null ? <ThemedText>Speed: {String(current.data.speed)} km/h</ThemedText> : null}

            {current.error ? (
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {(current.error as any)?.message ?? 'Failed'}
              </ThemedText>
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
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 0,
  },
  cardContent: {
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recenterBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  map: {
    width: '100%',
    height: 280,
  },
  errorText: { fontSize: 14 },
});

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

