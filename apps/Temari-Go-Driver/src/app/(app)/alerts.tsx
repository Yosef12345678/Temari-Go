import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { ScreenShell } from '@/components/ui/screen-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useDriverNotifications, type NotificationFilter } from '@/hooks/use-driver-notifications';

export default function AlertsScreen() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const { filtered, unreadCount, loading, error, load, markRead } = useDriverNotifications(filter);
  const filters: { label: string; value: NotificationFilter }[] = [
    { label: t('all'), value: 'all' },
    { label: t('operational'), value: 'operational' },
    { label: t('safetyLabel'), value: 'safety' },
  ];

  return (
    <ScreenShell title={t('communicationAlerts')} subtitle={t('unreadAlerts', { count: unreadCount })}>
      <ScrollView horizontal contentContainerStyle={styles.filters}>
        {filters.map((item) => (
          <FilterChip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />
        ))}
      </ScrollView>
      {loading ? <LoadingState message={t('loadingAlerts')} /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState title={t('noAlertsFound')} message={t('alertsAppearHere')} />
      ) : null}
      {!loading && !error ? (
        <View style={styles.content}>
        {filtered.map((item) => (
          <Card key={item.id} style={[styles.card, !item.read && styles.unread]}>
            <View style={styles.cardHeader}>
              <StatusBadge label={formatType(item.type)} tone={isSafetyType(item.type) ? 'danger' : 'info'} />
              <ThemedText type="small" themeColor="textSecondary">{formatDate(item.created_at)}</ThemedText>
            </View>
            <ThemedText>{item.message}</ThemedText>
            {!item.read ? (
              <Button onPress={() => markRead(item)} label={t('markRead')} variant="outline" />
            ) : null}
          </Card>
        ))}
        </View>
      ) : null}
    </ScreenShell>
  );
}

function isSafetyType(type: string) {
  return ['alcohol_alert', 'speed_violation', 'critical_motion_alert', 'sos_alert'].includes(type);
}

function formatType(type: string) {
  return type.replace(/_/g, ' ');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  content: { gap: Spacing.two },
  filters: { gap: Spacing.two },
  card: { gap: Spacing.two },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  unread: { borderLeftColor: '#2563eb', borderLeftWidth: 4 },
});
