import React from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { BellRing, Bus, CheckCheck, MapPin, UserCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
  const highlightBackground = useThemeColor({ light: '#eaf2ff', dark: '#132238' }, 'background');
  const sections = React.useMemo(
    () => groupNotificationsByDate((notifications.data?.data ?? []) as NotificationItem[], t),
    [notifications.data?.data, t]
  );
  const notificationItems = (notifications.data?.data ?? []) as NotificationItem[];
  const unreadCount = notificationItems.filter((item) => !item.read).length;
  const latestId = notifications.data?.data?.[0]?.id;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <RestrictedTabContent
        resolving={access.isResolving}
        restricted={access.isRestricted}
        title={t('notificationsTab.restrictedTitle')}
        subtitle={t('notificationsTab.restrictedSubtitle')}
        onRetry={() => {
          void access.refetch();
        }}>
      <View style={[styles.headerCard, { borderColor, backgroundColor: cardBackground }]}>
        <View style={styles.headerTop}>
          <View style={[styles.headerIcon, { backgroundColor: tint }]}>
            <BellRing color="#ffffff" size={22} />
          </View>
          <View style={styles.headerText}>
            <ThemedText type="title">{t('notificationsTab.title')}</ThemedText>
            <ThemedText style={{ color: mutedText }}>{t('notificationsTab.subtitle')}</ThemedText>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <SummaryPill label={t('notificationsTab.unread')} value={String(unreadCount)} icon={<BellRing size={14} color={tint} />} borderColor={borderColor} />
          <SummaryPill label={t('notificationsTab.read')} value={String(Math.max(notificationItems.length - unreadCount, 0))} icon={<CheckCheck size={14} color={tint} />} borderColor={borderColor} />
        </View>
      </View>

      {notifications.isLoading ? (
        <Card style={[styles.stateCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardContent style={styles.stateBody}>
            <BellRing color={iconColor} size={20} />
            <ThemedText>{t('common.loading')}</ThemedText>
          </CardContent>
        </Card>
      ) : null}
      {notifications.error ? (
        <Card style={[styles.stateCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardContent style={styles.stateBody}>
            <ThemedText type="defaultSemiBold" style={[styles.errorText, { color: errorColor }]}>
              {(notifications.error as any)?.message ?? t('notificationsTab.failedLoad')}
            </ThemedText>
            <Pressable accessibilityRole="button" onPress={() => void notifications.refetch()} style={[styles.secondaryButton, { borderColor }]}>
              <ThemedText type="defaultSemiBold">{t('common.retry')}</ThemedText>
            </Pressable>
          </CardContent>
        </Card>
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
          const action = resolveNotificationAction(item, t);

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
                      {isRead ? t('notificationsTab.read') : t('notificationsTab.unread')}
                    </ThemedText>
                  </Badge>
                </View>
                {item.body ? <ThemedText style={styles.bodyText}>{item.body}</ThemedText> : null}
                <View style={styles.metaRow}>
                  <ThemedText style={styles.timestamp}>{formatTimestamp(item.createdAt, t)}</ThemedText>
                  {status.route ? (
                    <View style={styles.routeTag}>
                      <Image
                        source={require('@/assets/images/icons/route-badge.svg')}
                        style={styles.routeIcon}
                        contentFit="contain"
                      />
                      <ThemedText style={styles.routeText}>{t('notificationsTab.routeLabel', { route: status.route })}</ThemedText>
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
                      {markRead.isPending ? t('notificationsTab.marking') : t('notificationsTab.markAsRead')}
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
                <ThemedText type="defaultSemiBold">{t('notificationsTab.emptyTitle')}</ThemedText>
                <ThemedText style={styles.emptyText}>{t('notificationsTab.emptySubtitle')}</ThemedText>
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
  container: { flex: 1, paddingHorizontal: 14, gap: 8 },
  headerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryPill: { flex: 1, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  summaryPillTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryValue: { fontSize: 18, lineHeight: 22 },
  stateCard: { borderWidth: 1, borderRadius: 16 },
  stateBody: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  listContent: { paddingTop: 6, paddingBottom: 20, gap: 4 },
  sectionHeader: { marginTop: 6, marginBottom: 2 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 0,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardBody: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  bodyText: { lineHeight: 21, opacity: 0.9 },
  timestamp: {
    opacity: 0.75,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeIcon: { width: 16, height: 16 },
  routeText: { opacity: 0.85, fontSize: 12 },
  button: {
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyCard: { borderWidth: 1, borderRadius: 16, marginTop: 4 },
  emptyBody: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  emptyImage: { width: 150, height: 92 },
  emptyText: { opacity: 0.78, textAlign: 'center' },
  errorText: { fontSize: 14 },
});

function SummaryPill({
  label,
  value,
  icon,
  borderColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  borderColor: string;
}) {
  return (
    <View style={[styles.summaryPill, { borderColor }]}>
      <View style={styles.summaryPillTop}>
        {icon}
        <ThemedText>{label}</ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" style={styles.summaryValue}>{value}</ThemedText>
    </View>
  );
}

function groupNotificationsByDate(items: NotificationItem[], t: (k: string) => string): NotificationSection[] {
  const grouped = new Map<string, NotificationItem[]>();

  const sorted = [...items].sort((a, b) => {
    const x = new Date(String(a.createdAt ?? '')).getTime();
    const y = new Date(String(b.createdAt ?? '')).getTime();
    return y - x;
  });

  for (const item of sorted) {
    const created = new Date(String(item.createdAt ?? ''));
    const key = Number.isNaN(created.getTime()) ? t('notificationsTab.recent') : sectionDateLabel(created, t);
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
}

function sectionDateLabel(value: Date, t: (k: string) => string) {
  const now = new Date();
  const sameDay =
    now.getFullYear() === value.getFullYear() &&
    now.getMonth() === value.getMonth() &&
    now.getDate() === value.getDate();
  if (sameDay) return t('notificationsTab.today');
  return value.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
}

function formatTimestamp(value: string | undefined, t: (k: string) => string) {
  if (!value) return t('notificationsTab.timeUnavailable');
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

function resolveNotificationAction(
  item: NotificationItem,
  t: (k: string) => string
): { label: string; type: 'tracking' | 'child' | 'billing'; studentId?: string } | null {
  const source = item as Record<string, unknown>;
  const studentId = String(source.studentId ?? source.student_id ?? source.childId ?? source.child_id ?? '');
  const text = `${String(item.title ?? '')} ${String(item.body ?? '')} ${String(item.type ?? '')}`.toLowerCase();

  if ((text.includes('bus') || text.includes('route') || text.includes('approach')) && studentId) {
    return { label: t('notificationsTab.actionTracking'), type: 'tracking', studentId };
  }
  if ((text.includes('board') || text.includes('reach') || text.includes('attendance')) && studentId) {
    return { label: t('notificationsTab.actionChild'), type: 'child', studentId };
  }
  if (text.includes('payment') || text.includes('invoice') || text.includes('due')) {
    return { label: t('notificationsTab.actionBilling'), type: 'billing' };
  }
  return null;
}

