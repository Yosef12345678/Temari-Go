import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { CalendarClock, CheckCircle2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAttendanceByStudent } from '@/src/hooks/useAttendance';

export default function ChildAttendanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useAttendanceByStudent(String(id ?? ''));
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Attendance' }} />
      {q.isLoading ? <ThemedText>Loading…</ThemedText> : null}
      {q.error ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{(q.error as any)?.message ?? 'Failed'}</ThemedText> : null}
      <FlatList
        data={(q.data ?? []) as any[]}
        keyExtractor={(item: any, idx) => String(item.id ?? idx)}
        refreshing={q.isRefetching}
        onRefresh={() => void q.refetch()}
        renderItem={({ item }: any) => {
          const eventType = String(item.type ?? '-');
          const isBoard = eventType.toLowerCase().includes('board');
          return (
            <View style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <View style={styles.rowTop}>
                <View style={styles.titleRow}>
                  {isBoard ? <CheckCircle2 color={iconColor} size={16} /> : <CalendarClock color={iconColor} size={16} />}
                  <ThemedText type="defaultSemiBold">{eventType}</ThemedText>
                </View>
                <Badge variant={isBoard ? 'default' : 'secondary'}>
                  <ThemedText>{isBoard ? 'Pickup' : 'Drop/Other'}</ThemedText>
                </Badge>
              </View>
              <ThemedText style={{ color: mutedText }}>{formatTimestamp(String(item.timestamp ?? item.createdAt ?? ''))}</ThemedText>
              <ThemedText>Bus: {String(item.busId ?? item.bus_id ?? '-')}</ThemedText>
            </View>
          );
        }}
        ListEmptyComponent={q.isLoading ? null : <ThemedText>No attendance records yet.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8, marginBottom: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  errorText: { fontSize: 14 },
});

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Time unavailable';
  return date.toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
