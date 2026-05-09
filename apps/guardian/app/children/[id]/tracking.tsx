import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Clock3, LocateFixed, Maximize2, Minimize2, Route } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useBusCurrent, useBusHistory } from '@/src/hooks/useLocations';
import { useStudentDetail } from '@/src/hooks/useStudents';

const WINDOW_HEIGHT = Dimensions.get('window').height;
/** Taller embedded map (~45% of screen, bounded for phones and tablets). */
const EMBEDDED_MAP_HEIGHT = Math.min(Math.max(Math.round(WINDOW_HEIGHT * 0.45), 340), 560);

export default function ChildTrackingScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const student = useStudentDetail(String(id ?? ''));
  const insets = useSafeAreaInsets();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const errorColor = useThemeColor({}, 'destructive');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const overlayBg = useThemeColor({ light: 'rgba(255,255,255,0.92)', dark: 'rgba(15,23,42,0.88)' }, 'background');
  const mapRefEmbedded = useRef<MapView | null>(null);
  const mapRefFullscreen = useRef<MapView | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

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

  const recenterEmbedded = useCallback(() => {
    mapRefEmbedded.current?.animateToRegion(mapRegion, 400);
  }, [mapRegion]);

  const recenterFullscreen = useCallback(() => {
    mapRefFullscreen.current?.animateToRegion(mapRegion, 400);
  }, [mapRegion]);

  const mapMarkers = useMemo(
    () => (
      <>
        {routePoints.length > 1 ? <Polyline coordinates={routePoints} strokeColor={tint} strokeWidth={3} /> : null}
        {homeCoords ? <Marker coordinate={homeCoords} title={t('trackingScreen.home')} pinColor="#22c55e" /> : null}
        {current.data?.latitude && current.data?.longitude ? (
          <Marker
            coordinate={{ latitude: current.data.latitude, longitude: current.data.longitude }}
            title={t('trackingScreen.busLabel', { busId })}
            description={t('trackingScreen.liveLocation')}
            pinColor={tint}
          />
        ) : null}
      </>
    ),
    [routePoints, homeCoords, current.data?.latitude, current.data?.longitude, busId, tint, t]
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('trackingScreen.title') }} />
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
        {!busId ? <ThemedText>{t('trackingScreen.noBusAssigned')}</ThemedText> : null}
        {busId ? (
          <Card style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
            <CardHeader style={styles.headerRow}>
              <CardTitle>{t('trackingScreen.liveRoute')}</CardTitle>
              <Badge variant="secondary">
                <ThemedText>{t('trackingScreen.busLabel', { busId })}</ThemedText>
              </Badge>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock3 color={iconColor} size={14} />
                  <ThemedText style={{ color: mutedText }}>
                    {current.data ? t('trackingScreen.updatedAt', { time: formatTimestamp(String(current.data.timestamp ?? ''), t) }) : t('trackingScreen.waitingLive')}
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <Route color={iconColor} size={14} />
                  <ThemedText style={{ color: mutedText }}>{t('trackingScreen.points', { count: routePoints.length })}</ThemedText>
                </View>
              </View>

              <View style={[styles.mapContainer, { borderColor }]}>
                <MapView
                  ref={mapRefEmbedded}
                  style={[styles.map, { height: EMBEDDED_MAP_HEIGHT }]}
                  initialRegion={mapRegion}>
                  {mapMarkers}
                </MapView>
                <View style={styles.mapOverlayTop} pointerEvents="box-none">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('trackingScreen.openFullscreen')}
                    style={[styles.mapOverlayBtn, { borderColor, backgroundColor: overlayBg }]}
                    onPress={() => setFullscreenOpen(true)}>
                    <Maximize2 color={iconColor} size={20} />
                  </Pressable>
                </View>
                <View style={styles.mapOverlayBottom} pointerEvents="box-none">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('trackingScreen.recenterA11y')}
                    style={[styles.mapOverlayBtn, styles.mapOverlayBtnWide, { borderColor, backgroundColor: overlayBg }]}
                    onPress={recenterEmbedded}>
                    <LocateFixed color={iconColor} size={18} />
                    <ThemedText type="defaultSemiBold">{t('trackingScreen.recenter')}</ThemedText>
                  </Pressable>
                </View>
              </View>

              {current.error ? (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>{(current.error as any)?.message ?? t('trackingScreen.failed')}</ThemedText>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </ScrollView>

      <Modal
        visible={fullscreenOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setFullscreenOpen(false)}>
        <View style={[styles.fullscreenRoot, { backgroundColor: cardBackground }]}>
          <MapView ref={mapRefFullscreen} style={styles.fullscreenMap} initialRegion={mapRegion}>
            {mapMarkers}
          </MapView>
          <View style={[styles.fullscreenOverlayTop, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('trackingScreen.exitFullscreen')}
              style={[styles.mapOverlayBtn, { borderColor, backgroundColor: overlayBg }]}
              onPress={() => setFullscreenOpen(false)}>
              <Minimize2 color={iconColor} size={20} />
            </Pressable>
          </View>
          <View
            style={[styles.fullscreenOverlayBottom, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}
            pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('trackingScreen.recenterA11y')}
              style={[styles.mapOverlayBtn, styles.mapOverlayBtnWide, { borderColor, backgroundColor: overlayBg }]}
              onPress={recenterFullscreen}>
              <LocateFixed color={iconColor} size={18} />
              <ThemedText type="defaultSemiBold">{t('trackingScreen.recenter')}</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  mapContainer: { overflow: 'hidden', borderRadius: 12, borderWidth: 1, position: 'relative' },
  map: { width: '100%' },
  mapOverlayTop: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  mapOverlayBottom: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  mapOverlayBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  mapOverlayBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  fullscreenRoot: { flex: 1 },
  fullscreenMap: { ...StyleSheet.absoluteFillObject },
  fullscreenOverlayTop: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  fullscreenOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  errorText: { fontSize: 14 },
});

function formatTimestamp(value: string, t: (k: string) => string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('trackingScreen.unknownTime');
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
