import React from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { BellRing } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { RestrictedTabContent } from '@/components/access/restricted-tab-content';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  NotificationCard,
  NotificationStateCard,
  NotificationsEmptyState,
  NotificationsHeader,
  groupNotificationsByDate,
  type NotificationsTheme,
} from '@/components/guardian/notifications-tab-components';
import { useParentAccess } from '@/src/hooks/useParentAccess';
import { useMarkNotificationRead, useNotifications } from '@/src/hooks/useNotifications';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { NotificationItem } from '@/src/types/notification';

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
  const notificationsTheme: NotificationsTheme = {
    borderColor,
    cardBackground,
    tint,
    errorColor,
    iconColor,
    mutedText,
    highlightBackground,
  };
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
      <NotificationsHeader
        theme={notificationsTheme}
        title={t('notificationsTab.title')}
        subtitle={t('notificationsTab.subtitle')}
        unreadLabel={t('notificationsTab.unread')}
        readLabel={t('notificationsTab.read')}
        unreadCount={unreadCount}
        readCount={Math.max(notificationItems.length - unreadCount, 0)}
      />

      {notifications.isLoading ? (
        <NotificationStateCard theme={notificationsTheme}>
          <BellRing color={iconColor} size={20} />
          <ThemedText>{t('common.loading')}</ThemedText>
        </NotificationStateCard>
      ) : null}
      {notifications.error ? (
        <NotificationStateCard theme={notificationsTheme}>
          <ThemedText type="defaultSemiBold" style={[styles.errorText, { color: errorColor }]}>
            {(notifications.error as any)?.message ?? t('notificationsTab.failedLoad')}
          </ThemedText>
          <Pressable accessibilityRole="button" onPress={() => void notifications.refetch()} style={[styles.secondaryButton, { borderColor }]}>
            <ThemedText type="defaultSemiBold">{t('common.retry')}</ThemedText>
          </Pressable>
        </NotificationStateCard>
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
          return (
            <NotificationCard
              item={item}
              theme={notificationsTheme}
              t={t}
              isLatest={String(item.id) === String(latestId)}
              markReadPending={markRead.isPending}
              onMarkRead={() => markRead.mutate(String(item.id))}
              onAction={(action) => {
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
            />
          );
        }}
        ListEmptyComponent={
          notifications.isLoading ? null : (
            <NotificationsEmptyState
              theme={notificationsTheme}
              title={t('notificationsTab.emptyTitle')}
              subtitle={t('notificationsTab.emptySubtitle')}
            />
          )
        }
      />
      </RestrictedTabContent>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, gap: 8 },
  listContent: { paddingTop: 6, paddingBottom: 20, gap: 4 },
  sectionHeader: { marginTop: 6, marginBottom: 2 },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  errorText: { fontSize: 14 },
});

