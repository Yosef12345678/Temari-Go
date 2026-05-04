import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStudentDetail } from '@/src/hooks/useStudents';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useStudentDetail(String(id ?? ''));
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Student</ThemedText>

      {q.isLoading ? <ThemedText>Loading…</ThemedText> : null}
      {q.error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {(q.error as any)?.message ?? 'Failed'}
        </ThemedText>
      ) : null}

      {q.data ? (
        <View style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
          <ThemedText type="defaultSemiBold">{String((q.data.student as any)?.full_name ?? id)}</ThemedText>
          <ThemedText>Grade: {String((q.data.student as any)?.grade ?? '-')}</ThemedText>
          <ThemedText>Bus: {String((q.data.student as any)?.busId ?? (q.data.student as any)?.bus_id ?? '-')}</ThemedText>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, { backgroundColor: tint }]}
        onPress={() => router.push(`/children/${id}/attendance` as any)}>
        <ThemedText type="defaultSemiBold">Attendance</ThemedText>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: tint }]}
        onPress={() => router.push(`/children/${id}/tracking` as any)}>
        <ThemedText type="defaultSemiBold">Bus tracking</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: { fontSize: 14 },
});

