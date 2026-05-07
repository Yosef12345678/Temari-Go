import React from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { BellRing, Bus, MapPin, UserCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { RestrictedTabContent } from '@/components/access/restricted-tab-content';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useParentAccess } from '@/src/hooks/useParentAccess';
import { useMarkNotificationRead, useNotifications } from '@/src/hooks/useNotifications';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { NotificationItem } from '@/src/types/notification';

type NotificationSection = {
  title: string;
  data: NotificationItem[];
};

export default function NotificationsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const access = useParentAccess();
  const notifications = useNotifications({ limit: 50, offset: 0 });
  const markRead = useMarkNotificationRead();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const heroBackground = useThemeColor({ light: '#eef4ff', dark: '#0f1d34' }, 'background');
  const highlightBackground = useThemeColor({ light: '#eaf2ff', dark: '#132238' }, 'background');
  const sections = React.useMemo(
    () => groupNotificationsByDate((notifications.data?.data ?? []) as NotificationItem[]),
    [notifications.data?.data]
  );
  const latestId = notifications.data?.data?.[0]?.id;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <RestrictedTabContent
        resolving={access.isResolving}
        restricted={access.isRestricted}
        title="Student access required"
        subtitle="Notifications are available after an admin assigns at least one student to your account."
        onRetry={() => {
          void access.refetch();
        }}>
      <View style={[styles.headerCard, { borderColor, backgroundColor: heroBackground }]}>
        <ThemedText type="title">Notifications</ThemedText>
        <ThemedText style={{ color: mutedText }}>Route updates, attendance events, and billing alerts.</ThemedText>
      </View>

      {notifications.isLoading ? <ThemedText>Loading…</ThemedText> : null}
      {notifications.error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {(notifications.error as any)?.message ?? 'Failed to load notifications'}
        </ThemedText>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshing={notifications.isRefetching}
        onRefresh={() => void notifications.refetch()}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">{section.title}</ThemedText>
          </View>
        )}
        renderItem={({ item }) => {
          const isRead = Boolean(item.read);
          const isHighlighted = String(item.id) === String(latestId);
          const status = resolveStatus(item, iconColor);
          const action = resolveNotificationAction(item);

          return (
            <Card
              style={[
                styles.card,
                { borderColor, backgroundColor: isHighlighted ? highlightBackground : cardBackground },
              ]}>
              <CardContent style={styles.cardBody}>
                <View style={styles.rowTop}>
                  <View style={styles.rowTitle}>
                    {status.icon}
                    <ThemedText type="defaultSemiBold">{resolveTitle(item)}</ThemedText>
                  </View>
                  <Badge variant={isRead ? 'secondary' : 'default'}>
                    <ThemedText
                      lightColor={isRead ? '#334155' : '#ffffff'}
                      darkColor={isRead ? '#cbd5e1' : '#020617'}>
                      {isRead ? 'Read' : 'Unread'}
                    </ThemedText>
                  </Badge>
                </View>
                {item.body ? <ThemedText>{item.body}</ThemedText> : null}
                <View style={styles.metaRow}>
                  <ThemedText style={styles.timestamp}>{formatTimestamp(item.createdAt)}</ThemedText>
                  {status.route ? (
                    <View style={styles.routeTag}>
                      <Image
                        source={require('@/assets/images/icons/route-badge.svg')}
                        style={styles.routeIcon}
                        contentFit="contain"
                      />
                      <ThemedText style={styles.routeText}>Route {status.route}</ThemedText>
                    </View>
                  ) : null}
                </View>
                {!isRead ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={markRead.isPending}
                    onPress={() => markRead.mutate(String(item.id))}
                    style={[styles.button, { backgroundColor: tint }]}>
                    <ThemedText type="defaultSemiBold">
                      {markRead.isPending ? 'Marking…' : 'Mark as read'}
                    </ThemedText>
                  </Pressable>
                ) : null}
                {action ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (action.type === 'tracking') {
                        router.push(`/children/${action.studentId}/tracking` as any);
                        return;
                      }
                      if (action.type === 'child') {
                        router.push(`/children/${action.studentId}` as any);
                        return;
                      }
                      router.push('/(tabs)/billing' as any);
                    }}
                    style={[styles.secondaryButton, { borderColor }]}>
                    <ThemedText type="defaultSemiBold">{action.label}</ThemedText>
                  </Pressable>
                ) : null}
              </CardContent>
            </Card>
          );
        }}
        ListEmptyComponent={
          notifications.isLoading ? null : (
            <Card style={[styles.emptyCard, { borderColor, backgroundColor: cardBackground }]}>
              <CardContent style={styles.emptyBody}>
                <Image
                  source={require('@/assets/images/illustrations/empty-notifications.svg')}
                  style={styles.emptyImage}
                  contentFit="contain"
                />
                <ThemedText type="defaultSemiBold">No notifications yet</ThemedText>
                <ThemedText style={styles.emptyText}>Updates about bus routes, attendance, and billing will appear here.</ThemedText>
              </CardContent>
            </Card>
          )
        }
      />
      </RestrictedTabContent>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  listContent: { paddingVertical: 8, paddingBottom: 24, gap: 8 },
  sectionHeader: { marginTop: 4, marginBottom: 4 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 0,
    marginBottom: 10,
  },
  cardBody: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  timestamp: {
    opacity: 0.75,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeIcon: { width: 16, height: 16 },
  routeText: { opacity: 0.85, fontSize: 12 },
  button: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 9,
  },
  emptyCard: { borderWidth: 1, borderRadius: 14, marginTop: 4 },
  emptyBody: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyImage: { width: 180, height: 110 },
  emptyText: { opacity: 0.78, textAlign: 'center' },
  errorText: { fontSize: 14 },
});

function groupNotificationsByDate(items: NotificationItem[]): NotificationSection[] {
  const grouped = new Map<string, NotificationItem[]>();

  const sorted = [...items].sort((a, b) => {
    const x = new Date(String(a.createdAt ?? '')).getTime();
    const y = new Date(String(b.createdAt ?? '')).getTime();
    return y - x;
  });

  for (const item of sorted) {
    const created = new Date(String(item.createdAt ?? ''));
    const key = Number.isNaN(created.getTime()) ? 'Recent' : sectionDateLabel(created);
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
}

function sectionDateLabel(value: Date) {
  const now = new Date();
  const sameDay =
    now.getFullYear() === value.getFullYear() &&
    now.getMonth() === value.getMonth() &&
    now.getDate() === value.getDate();
  if (sameDay) return 'Today';
  return value.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
}

function formatTimestamp(value: string | undefined) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function resolveTitle(item: NotificationItem) {
  return String(item.title ?? item.type ?? 'Notification');
}

function resolveStatus(item: NotificationItem, iconColor: string) {
  const text = `${String(item.title ?? '')} ${String(item.body ?? '')} ${String(item.type ?? '')}`.toLowerCase();
  const routeMatch = text.match(/route[\s:-]*([a-z0-9-]+)/i);
  const route = routeMatch?.[1]?.toUpperCase();

  if (text.includes('started')) {
    return { icon: <Bus size={16} color={iconColor} />, route };
  }
  if (text.includes('approach')) {
    return { icon: <MapPin size={16} color={iconColor} />, route };
  }
  if (text.includes('board')) {
    return { icon: <UserCheck size={16} color={iconColor} />, route };
  }
  if (text.includes('reach') || text.includes('arriv')) {
    return { icon: <BellRing size={16} color={iconColor} />, route };
  }
  return { icon: <BellRing size={16} color={iconColor} />, route };
}

function resolveNotificationAction(item: NotificationItem):
  | { label: string; type: 'tracking' | 'child' | 'billing'; studentId?: string }
  | null {
  const source = item as Record<string, unknown>;
  const studentId = String(source.studentId ?? source.student_id ?? source.childId ?? source.child_id ?? '');
  const text = `${String(item.title ?? '')} ${String(item.body ?? '')} ${String(item.type ?? '')}`.toLowerCase();

  if ((text.includes('bus') || text.includes('route') || text.includes('approach')) && studentId) {
    return { label: 'Open live tracking', type: 'tracking', studentId };
  }
  if ((text.includes('board') || text.includes('reach') || text.includes('attendance')) && studentId) {
    return { label: 'Open student details', type: 'child', studentId };
  }
  if (text.includes('payment') || text.includes('invoice') || text.includes('due')) {
    return { label: 'Open billing', type: 'billing' };
  }
  return null;
}

