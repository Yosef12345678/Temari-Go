import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BellRing, Bus, CheckCheck, MapPin, UserCheck } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { NotificationItem } from '@/src/types/notification';

export type NotificationsTheme = {
  borderColor: string;
  cardBackground: string;
  tint: string;
  errorColor: string;
  iconColor: string;
  mutedText: string;
  highlightBackground: string;
};

type Translation = (key: string, options?: any) => string;

export type NotificationSection = {
  title: string;
  data: NotificationItem[];
};

export type NotificationAction = { label: string; type: 'tracking' | 'child' | 'billing'; studentId?: string };

type NotificationsHeaderProps = {
  theme: NotificationsTheme;
  title: string;
  subtitle: string;
  unreadLabel: string;
  readLabel: string;
  unreadCount: number;
  readCount: number;
};

export function NotificationsHeader({ theme, title, subtitle, unreadLabel, readLabel, unreadCount, readCount }: NotificationsHeaderProps) {
  return (
    <View style={[styles.headerCard, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <View style={styles.headerTop}>
        <View style={[styles.headerIcon, { backgroundColor: theme.tint }]}>
          <BellRing color="#ffffff" size={22} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.headerTitle}>{title}</ThemedText>
          <ThemedText style={{ color: theme.mutedText }}>{subtitle}</ThemedText>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <SummaryPill label={unreadLabel} value={String(unreadCount)} icon={<BellRing size={14} color={theme.tint} />} borderColor={theme.borderColor} />
        <SummaryPill label={readLabel} value={String(readCount)} icon={<CheckCheck size={14} color={theme.tint} />} borderColor={theme.borderColor} />
      </View>
    </View>
  );
}

type NotificationStateCardProps = {
  theme: NotificationsTheme;
  children: React.ReactNode;
};

export function NotificationStateCard({ theme, children }: NotificationStateCardProps) {
  return (
    <Card style={[styles.stateCard, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <CardContent style={styles.stateBody}>{children}</CardContent>
    </Card>
  );
}

type NotificationCardProps = {
  item: NotificationItem;
  theme: NotificationsTheme;
  t: Translation;
  isLatest: boolean;
  markReadPending: boolean;
  onMarkRead: () => void;
  onAction: (action: NotificationAction) => void;
};

export function NotificationCard({ item, theme, t, isLatest, markReadPending, onMarkRead, onAction }: NotificationCardProps) {
  const isRead = Boolean(item.read);
  const status = resolveNotificationStatus(item, theme.iconColor);
  const action = resolveNotificationAction(item, t);

  return (
    <Card style={[styles.card, { borderColor: theme.borderColor, backgroundColor: isLatest ? theme.highlightBackground : theme.cardBackground }]}>
      <CardContent style={styles.cardBody}>
        <View style={styles.rowTop}>
          <View style={styles.rowTitle}>
            {status.icon}
            <ThemedText type="defaultSemiBold">{resolveNotificationTitle(item)}</ThemedText>
          </View>
          <Badge variant={isRead ? 'secondary' : 'default'} style={!isRead ? { backgroundColor: '#111827' } : undefined}>
            <ThemedText lightColor={isRead ? '#334155' : '#ffffff'} darkColor={isRead ? '#cbd5e1' : '#ffffff'} style={styles.badgeText}>
              {isRead ? t('notificationsTab.read') : t('notificationsTab.unread')}
            </ThemedText>
          </Badge>
        </View>
        {item.body ? <ThemedText style={styles.bodyText}>{item.body}</ThemedText> : null}
        <View style={styles.metaRow}>
          <ThemedText style={styles.timestamp}>{formatNotificationTimestamp(item.createdAt, t)}</ThemedText>
          {status.route ? (
            <View style={styles.routeTag}>
              <Image source={require('@/assets/images/icons/route-badge.svg')} style={styles.routeIcon} contentFit="contain" />
              <ThemedText style={styles.routeText}>{t('notificationsTab.routeLabel', { route: status.route })}</ThemedText>
            </View>
          ) : null}
        </View>
        {!isRead ? (
          <Pressable accessibilityRole="button" disabled={markReadPending} onPress={onMarkRead} style={[styles.button, { backgroundColor: theme.tint }]}>
            <ThemedText type="defaultSemiBold" lightColor="#ffffff" darkColor="#020617">
              {markReadPending ? t('notificationsTab.marking') : t('notificationsTab.markAsRead')}
            </ThemedText>
          </Pressable>
        ) : null}
        {action ? (
          <Pressable accessibilityRole="button" onPress={() => onAction(action)} style={[styles.secondaryButton, { borderColor: theme.borderColor }]}>
            <ThemedText type="defaultSemiBold">{action.label}</ThemedText>
          </Pressable>
        ) : null}
      </CardContent>
    </Card>
  );
}

type NotificationsEmptyStateProps = {
  theme: NotificationsTheme;
  title: string;
  subtitle: string;
};

export function NotificationsEmptyState({ theme, title, subtitle }: NotificationsEmptyStateProps) {
  return (
    <Card style={[styles.emptyCard, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <CardContent style={styles.emptyBody}>
        <Image source={require('@/assets/images/illustrations/empty-notifications.svg')} style={styles.emptyImage} contentFit="contain" />
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={styles.emptyText}>{subtitle}</ThemedText>
      </CardContent>
    </Card>
  );
}

export function SummaryPill({ label, value, icon, borderColor }: { label: string; value: string; icon: React.ReactNode; borderColor: string }) {
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

export function groupNotificationsByDate(items: NotificationItem[], t: Translation): NotificationSection[] {
  const grouped = new Map<string, NotificationItem[]>();
  const sorted = [...items].sort((a, b) => {
    const x = new Date(String(a.createdAt ?? '')).getTime();
    const y = new Date(String(b.createdAt ?? '')).getTime();
    return y - x;
  });

  for (const item of sorted) {
    const created = new Date(String(item.createdAt ?? ''));
    const key = Number.isNaN(created.getTime()) ? t('notificationsTab.recent') : notificationSectionDateLabel(created, t);
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
}

export function resolveNotificationAction(item: NotificationItem, t: Translation): NotificationAction | null {
  const source = item as Record<string, unknown>;
  const studentId = String(source.studentId ?? source.student_id ?? source.childId ?? source.child_id ?? '');
  const text = `${String(item.title ?? '')} ${String(item.body ?? '')} ${String(item.type ?? '')}`.toLowerCase();

  if ((text.includes('bus') || text.includes('route' ) || text.includes('approach')) && studentId) {
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

function notificationSectionDateLabel(value: Date, t: Translation) {
  const now = new Date();
  const sameDay = now.getFullYear() === value.getFullYear() && now.getMonth() === value.getMonth() && now.getDate() === value.getDate();
  if (sameDay) return t('notificationsTab.today');
  return value.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
}

function formatNotificationTimestamp(value: string | undefined, t: Translation) {
  if (!value) return t('notificationsTab.timeUnavailable');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function resolveNotificationTitle(item: NotificationItem) {
  return String(item.title ?? item.type ?? 'Notification');
}

function resolveNotificationStatus(item: NotificationItem, iconColor: string) {
  const text = `${String(item.title ?? '')} ${String(item.body ?? '')} ${String(item.type ?? '')}`.toLowerCase();
  const routeMatch = text.match(/route[\s:-]*([a-z0-9-]+)/i);
  const route = routeMatch?.[1]?.toUpperCase();

  if (text.includes('started')) return { icon: <Bus size={16} color={iconColor} />, route };
  if (text.includes('approach')) return { icon: <MapPin size={16} color={iconColor} />, route };
  if (text.includes('board')) return { icon: <UserCheck size={16} color={iconColor} />, route };
  if (text.includes('reach') || text.includes('arriv')) return { icon: <BellRing size={16} color={iconColor} />, route };
  return { icon: <BellRing size={16} color={iconColor} />, route };
}

const styles = StyleSheet.create({
  headerCard: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 3 },
  headerTitle: { fontSize: 28, lineHeight: 34 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryPill: { flex: 1, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  summaryPillTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryValue: { fontSize: 18, lineHeight: 22 },
  stateCard: { borderWidth: 1, borderRadius: 16, paddingVertical: 0 },
  stateBody: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  card: { borderWidth: 1, borderRadius: 18, paddingVertical: 0, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  cardBody: { gap: 8, paddingHorizontal: 14, paddingVertical: 14 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  badgeText: { fontSize: 13, lineHeight: 17 },
  bodyText: { lineHeight: 21, opacity: 0.9 },
  timestamp: { opacity: 0.75, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  routeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeIcon: { width: 16, height: 16 },
  routeText: { opacity: 0.85, fontSize: 12 },
  button: { paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  secondaryButton: { borderWidth: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 9 },
  emptyCard: { borderWidth: 1, borderRadius: 18, marginTop: 4, paddingVertical: 0 },
  emptyBody: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyImage: { width: 150, height: 92 },
  emptyText: { opacity: 0.78, textAlign: 'center' },
});
