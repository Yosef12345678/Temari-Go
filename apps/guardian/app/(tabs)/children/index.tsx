import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppBrand } from '@/components/app-brand';
import { useStudentsList } from '@/src/hooks/useStudents';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChildrenTab() {
  const students = useStudentsList();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');

  return (
    <ThemedView style={styles.container}>
      <AppBrand subtitle="Your children" />

      {students.isLoading ? <ThemedText>Loading…</ThemedText> : null}
      {students.error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {(students.error as any)?.message ?? 'Failed to load'}
        </ThemedText>
      ) : null}

      <FlatList
        data={students.data ?? []}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }: any) => (
          <Link href={`/children/${item.id}`} asChild>
            <Pressable style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <ThemedText type="defaultSemiBold">{item.full_name ?? 'Student'}</ThemedText>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <ThemedText>Grade: {String(item.grade ?? '-')}</ThemedText>
                <ThemedText>Id: {String(item.id)}</ThemedText>
              </View>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          students.isLoading ? null : <ThemedText>No students found for this parent.</ThemedText>
        }
      />
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
    marginBottom: 10,
  },
  errorText: { fontSize: 14 },
});

