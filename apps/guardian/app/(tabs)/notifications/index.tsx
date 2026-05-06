import React from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { BellRing, Bus, ChevronLeft, ChevronRight, MapPin, UserCheck } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMarkNotificationRead, useNotifications } from '@/src/hooks/useNotifications';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { NotificationItem } from '@/src/types/notification';

type NotificationSection = {
  title: string;
  data: NotificationItem[];
};

export default function NotificationsTab() {
  const notifications = useNotifications({ limit: 50, offset: 0 });
  const markRead = useMarkNotificationRead();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const sections = React.useMemo(
    () => groupNotificationsByDate((notifications.data?.data ?? []) as NotificationItem[]),
    [notifications.data?.data]
  );
  const latestId = notifications.data?.data?.[0]?.id;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ChevronLeft color={iconColor} size={20} />
          <ThemedText type="title">Notifications</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <ChevronLeft color={iconColor} size={16} />
          <ChevronRight color={iconColor} size={16} />
        </View>
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
          const status = resolveStatus(item);

          return (
            <Card
              style={[
                styles.card,
                { borderColor, backgroundColor: isHighlighted ? '#ffe780' : cardBackground },
              ]}>
              <CardContent style={styles.cardBody}>
                <View style={styles.rowTop}>
                  <View style={styles.rowTitle}>
                    {status.icon}
                    <ThemedText type="defaultSemiBold">{resolveTitle(item)}</ThemedText>
                  </View>
                  <Badge variant={isRead ? 'secondary' : 'default'}>
                    <ThemedText>{isRead ? 'Read' : 'Unread'}</ThemedText>
                  </Badge>
                </View>
                {item.body ? <ThemedText>{item.body}</ThemedText> : null}
                <ThemedText style={styles.timestamp}>
                  {formatTimestamp(item.createdAt)} {status.route ? `| Route ${status.route}` : ''}
                </ThemedText>
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
              </CardContent>
            </Card>
          );
        }}
        ListEmptyComponent={
          notifications.isLoading ? null : <ThemedText>No notifications yet.</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  button: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
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

function resolveStatus(item: NotificationItem) {
  const text = `${String(item.title ?? '')} ${String(item.body ?? '')} ${String(item.type ?? '')}`.toLowerCase();
  const routeMatch = text.match(/route[\s:-]*([a-z0-9-]+)/i);
  const route = routeMatch?.[1]?.toUpperCase();

  if (text.includes('started')) {
    return { icon: <Bus size={16} color="#2b2b2b" />, route };
  }
  if (text.includes('approach')) {
    return { icon: <MapPin size={16} color="#2b2b2b" />, route };
  }
  if (text.includes('board')) {
    return { icon: <UserCheck size={16} color="#2b2b2b" />, route };
  }
  if (text.includes('reach') || text.includes('arriv')) {
    return { icon: <BellRing size={16} color="#2b2b2b" />, route };
  }
  return { icon: <BellRing size={16} color="#2b2b2b" />, route };
}

