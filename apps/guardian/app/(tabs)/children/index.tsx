import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppBrand } from '@/components/app-brand';
import { RestrictedTabContent } from '@/components/access/restricted-tab-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useParentAccess } from '@/src/hooks/useParentAccess';
import { useStudentsList } from '@/src/hooks/useStudents';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { StudentListItem } from '@/src/types/student';

export default function ChildrenTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const students = useStudentsList();
  const access = useParentAccess();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <RestrictedTabContent
        resolving={access.isResolving}
        restricted={access.isRestricted}
        title="Student access required"
        subtitle="Student registration is managed by admins. Contact admin to assign a child to your account."
        onRetry={() => {
          void access.refetch();
        }}>
      <AppBrand subtitle="Your children" />

      {students.isLoading ? <ThemedText>Loading…</ThemedText> : null}
      {students.error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {(students.error as any)?.message ?? 'Failed to load'}
        </ThemedText>
      ) : null}

      <FlatList
        data={students.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshing={students.isRefetching}
        onRefresh={() => void students.refetch()}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open details for ${item.full_name ?? 'student'}`}
            style={styles.pressable}
            onPress={() => router.push(`/children/${item.id}` as any)}>
            <Card style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <CardContent style={styles.cardBody}>
                <View style={styles.leftSection}>
                  <Avatar className="size-12" alt={`${item.full_name ?? 'Student'} avatar`}>
                    <AvatarImage source={{ uri: String(item.avatarUrl ?? '') }} />
                    <AvatarFallback>
                      <ThemedText type="defaultSemiBold">{getInitials(item)}</ThemedText>
                    </AvatarFallback>
                  </Avatar>
                  <View style={styles.nameSection}>
                    <ThemedText type="defaultSemiBold">{item.full_name ?? 'Student'}</ThemedText>
                    <ThemedText style={styles.subtitle}>International School</ThemedText>
                    <View style={styles.badges}>
                      <Badge variant="secondary">
                        <ThemedText>Grade {String(item.grade ?? '-')}</ThemedText>
                      </Badge>
                      <Badge variant="outline">
                        <ThemedText>ID {String(item.id)}</ThemedText>
                      </Badge>
                    </View>
                  </View>
                </View>
                <ChevronRight color={borderColor} size={18} />
              </CardContent>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          students.isLoading ? null : <ThemedText>No students found for this parent.</ThemedText>
        }
      />
      </RestrictedTabContent>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  pressable: { marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 0,
  },
  cardBody: {
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  nameSection: {
    gap: 4,
    flexShrink: 1,
  },
  subtitle: {
    opacity: 0.7,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  errorText: { fontSize: 14 },
});

function getInitials(student: StudentListItem) {
  const name = String(student.full_name ?? '').trim();
  if (!name) return 'S';
  const parts = name.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

