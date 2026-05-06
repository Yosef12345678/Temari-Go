import React, { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStudentDetail } from '@/src/hooks/useStudents';
import { useBusCurrent } from '@/src/hooks/useLocations';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChildTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const student = useStudentDetail(String(id ?? ''));
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');

  const busId = useMemo(() => {
    const s: any = student.data?.student;
    return String(s?.busId ?? s?.bus_id ?? '');
  }, [student.data]);

  const current = useBusCurrent(busId, { refetchIntervalMs: 8_000 });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={student.isRefetching || current.isRefetching}
            onRefresh={() => {
              void student.refetch();
              if (busId) {
                void current.refetch();
              }
            }}
          />
        }>
        <ThemedText type="title">Bus tracking</ThemedText>

      {!busId ? <ThemedText>No bus assigned for this student.</ThemedText> : null}

        {busId ? (
          <View style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
            <ThemedText type="defaultSemiBold">Bus: {busId}</ThemedText>
            {current.isLoading ? <ThemedText>Loading location…</ThemedText> : null}
            {current.error ? (
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {(current.error as any)?.message ?? 'Failed'}
              </ThemedText>
            ) : null}
            {current.data ? (
              <>
                <ThemedText>
                  Lat/Lng: {String(current.data.latitude)}, {String(current.data.longitude)}
                </ThemedText>
                <ThemedText>Speed: {String(current.data.speed ?? '-')}</ThemedText>
                <ThemedText>Time: {String(current.data.timestamp ?? '-')}</ThemedText>
              </>
            ) : null}
          </View>
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
    padding: 14,
    gap: 6,
  },
  errorText: { fontSize: 14 },
});

