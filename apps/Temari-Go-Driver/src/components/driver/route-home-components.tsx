import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Bell, Bus, CheckCircle2, Clock3, MapPinned, Radio, Route, UsersRound } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';
import type { AlcoholCheckSession, DriverJob, DriverJobStatus } from '@/types/driver';

type IconComponent = React.ComponentType<{ color?: string; size?: number }>;

export function SyncPill({ status, unreadCount }: { status: string; unreadCount?: number }) {
  const theme = useTheme();
  const isOnline = status === 'online';
  const color = isOnline ? '#16a34a' : status === 'offline' ? '#dc2626' : '#d97706';

  return (
    <View style={[styles.syncPill, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}>
      <Radio size={14} color={color} />
      <ThemedText type="smallBold" style={{ color }}>
        {status}
      </ThemedText>
      {typeof unreadCount === 'number' ? (
        <View style={[styles.unreadBadge, { backgroundColor: theme.background }]}> 
          <Bell size={12} color={theme.icon} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.unreadText}>{unreadCount}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export function RouteHero({ job, syncStatus, unreadCount }: { job: DriverJob | null; syncStatus: string; unreadCount?: number }) {
  const { t } = useI18n();
  return (
    <Card style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroIconWrap}>
          <Bus size={28} color="#ffffff" />
        </View>
        <SyncPill status={syncStatus} unreadCount={unreadCount} />
      </View>
      <ThemedText type="subtitle" style={styles.heroTitle}>{job?.name ?? t('readyForNextRoute')}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.heroSubtitle}>
        {job ? `${t('busNumber', { number: job.bus?.bus_number ?? job.bus_id })} · ${formatStatus(job.lifecycle_status)}` : t('noActiveAssignment')}
      </ThemedText>
    </Card>
  );
}

export function RouteStats({ job }: { job: DriverJob }) {
  const { t } = useI18n();
  const stopCount = job.route_stops_eta?.length ?? 0;
  const nextEta = job.route_stops_eta?.[0]?.eta_minutes;
  const multiplier = job.traffic_multiplier ? `${job.traffic_multiplier}x` : t('normal');

  return (
    <View style={styles.statsGrid}>
      <StatCard icon={UsersRound} label={t('stops')} value={`${stopCount}`} />
      <StatCard icon={Clock3} label={t('nextEta')} value={typeof nextEta === 'number' ? `${nextEta} min` : '--'} />
      <StatCard icon={Route} label={t('traffic')} value={multiplier} />
    </View>
  );
}

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="smallBold" style={styles.sectionTitle}>{title}</ThemedText>
      {detail ? <ThemedText type="small" themeColor="textSecondary">{detail}</ThemedText> : null}
    </View>
  );
}

export function StopEtaCard({ index, name, etaMinutes }: { index: number; name: string; etaMinutes: number }) {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <Card style={styles.stopCard}>
      <View style={[styles.stopNumber, { backgroundColor: `${theme.tint}18` }]}> 
        <ThemedText type="smallBold" style={{ color: theme.tint }}>{index + 1}</ThemedText>
      </View>
      <View style={styles.stopCopy}>
        <ThemedText type="smallBold">{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{t('pickupStop')}</ThemedText>
      </View>
      <View style={styles.etaWrap}>
        <MapPinned size={14} color={theme.icon} />
        <ThemedText type="smallBold">{etaMinutes} min</ThemedText>
      </View>
    </Card>
  );
}

type RouteTransitionAction = 'accept' | 'arrive' | 'pickup' | 'complete';

function nextActionConfig(t: ReturnType<typeof useI18n>['t']): Partial<Record<DriverJobStatus, { action: RouteTransitionAction; label: string; helper: string }>> {
  return {
    assigned: { action: 'accept', label: t('acceptRoute'), helper: t('confirmRouteAssignment') },
    accepted: { action: 'arrive', label: t('markArrived'), helper: t('reachPickupArea') },
    arrived: { action: 'pickup', label: t('startPickup'), helper: t('confirmBoarding') },
    picked_up: { action: 'complete', label: t('completeRoute'), helper: t('finishAfterDropoff') },
  };
}

export function RouteActionPanel({
  status,
  onTransition,
  alcoholCheck,
  scheduleActive = false,
  scheduleLabel,
  secondsRemaining,
  pendingAction,
}: {
  status: DriverJobStatus;
  onTransition: (action: RouteTransitionAction) => void;
  alcoholCheck?: AlcoholCheckSession | null;
  scheduleActive?: boolean;
  scheduleLabel?: string;
  secondsRemaining?: number;
  pendingAction?: RouteTransitionAction | null;
}) {
  const { t } = useI18n();
  const next = nextActionConfig(t)[status];
  const outsideSchedule = status === 'assigned' && !scheduleActive;
  const acceptBlocked =
    status === 'assigned' &&
    (outsideSchedule || alcoholCheck?.status === 'pending' || alcoholCheck?.status === 'failed');
  const acceptLabel = status === 'assigned'
    ? outsideSchedule
      ? t('outsideTestHours')
      : alcoholCheck?.status === 'passed'
        ? t('acceptRoute')
        : alcoholCheck?.status === 'pending'
          ? t('blowIntoBusDevice')
          : t('readyStartBreathCheck')
    : next?.label;
  const helper = status === 'assigned'
    ? outsideSchedule
      ? scheduleLabel ?? t('breathTestWindowOnly')
      : alcoholCheck?.status === 'passed'
        ? t('breathTestPassed')
        : alcoholCheck?.status === 'pending'
          ? t('tapStartedBlowWindow', { seconds: secondsRemaining ?? 0 })
          : alcoholCheck?.status === 'failed'
            ? t('alcoholTestFailed')
            : alcoholCheck?.status === 'expired'
              ? t('breathTestExpired')
              : t('tapReadyBlow')
    : next?.helper;

  return (
    <Card style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <CheckCircle2 size={18} color="#16a34a" />
        <ThemedText type="smallBold">{t('routeProgress')}</ThemedText>
      </View>
      {next ? (
        <>
          <ThemedText themeColor="textSecondary">{helper}</ThemedText>
          <Button
            disabled={acceptBlocked || alcoholCheck?.status === 'failed'}
            onPress={() => onTransition(next.action)}
            label={acceptLabel ?? next.label}
            loading={pendingAction === next.action}
          />
        </>
      ) : (
        <ThemedText themeColor="textSecondary">{t('noRouteAction')}</ThemedText>
      )}
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string }) {
  const theme = useTheme();

  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${theme.tint}16` }]}> 
        <Icon size={18} color={theme.tint} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold" style={styles.statValue}>{value}</ThemedText>
    </Card>
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

const styles = StyleSheet.create({
  heroCard: {
    padding: Spacing.four,
    gap: Spacing.three,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 31,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    textTransform: 'capitalize',
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadText: {
    fontSize: 11,
    lineHeight: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    gap: 5,
    padding: 12,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopCopy: {
    flex: 1,
  },
  etaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCard: {
    gap: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
});
