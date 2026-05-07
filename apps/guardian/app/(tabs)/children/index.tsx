import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, GraduationCap, IdCard, MoveRight, School } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
  const iconColor = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'icon');
  const heroBackground = useThemeColor({ light: '#eef4ff', dark: '#0f1d34' }, 'background');

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
      <View style={[styles.heroCard, { borderColor, backgroundColor: heroBackground }]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBrandRow}>
            <Image source={require('@/assets/images/transport.svg')} style={styles.heroLogo} contentFit="contain" />
            <View>
              <ThemedText type="defaultSemiBold">Temari Guardian</ThemedText>
              <ThemedText style={{ color: muted }}>Premium parent experience</ThemedText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            style={[styles.heroCta, { backgroundColor: tint }]}
            onPress={() => {
              const first = students.data?.[0];
              if (first?.id) {
                router.push(`/children/${first.id}/tracking` as any);
              }
            }}>
            <ThemedText type="defaultSemiBold">Track</ThemedText>
            <MoveRight color="#0f172a" size={16} />
          </Pressable>
        </View>
        <View style={styles.heroMessageWrap}>
          <Image source={require('@/assets/images/illustrations/support-hero.svg')} style={styles.heroIllustration} contentFit="contain" />
          <View style={styles.heroTextWrap}>
            <ThemedText type="subtitle">Student tracking made simple</ThemedText>
            <ThemedText style={{ color: muted }}>
              Monitor routes, check attendance updates, and open child details from a single place.
            </ThemedText>
          </View>
        </View>
      </View>

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
                    <AvatarImage
                      source={
                        String(item.avatarUrl ?? '').trim()
                          ? { uri: String(item.avatarUrl ?? '') }
                          : require('@/assets/images/placeholders/student-default.svg')
                      }
                    />
                    <AvatarFallback>
                      <ThemedText type="defaultSemiBold">{getInitials(item)}</ThemedText>
                    </AvatarFallback>
                  </Avatar>
                  <View style={styles.nameSection}>
                    <ThemedText type="defaultSemiBold">{item.full_name ?? 'Student'}</ThemedText>
                    <View style={styles.metaRow}>
                      <School color={iconColor} size={14} />
                      <ThemedText style={styles.subtitle}>International School</ThemedText>
                    </View>
                    <View style={styles.badges}>
                      <Badge variant="secondary">
                        <View style={styles.badgeInner}>
                          <GraduationCap color={iconColor} size={13} />
                          <ThemedText>Grade {String(item.grade ?? '-')}</ThemedText>
                        </View>
                      </Badge>
                      <Badge variant="outline">
                        <View style={styles.badgeInner}>
                          <IdCard color={iconColor} size={13} />
                          <ThemedText>ID {String(item.id)}</ThemedText>
                        </View>
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
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  heroLogo: {
    width: 42,
    height: 42,
  },
  heroCta: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMessageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIllustration: {
    width: 92,
    height: 64,
  },
  heroTextWrap: {
    gap: 2,
    flex: 1,
  },
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  badgeInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  errorText: { fontSize: 14 },
});

function getInitials(student: StudentListItem) {
  const name = String(student.full_name ?? '').trim();
  if (!name) return 'S';
  const parts = name.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

