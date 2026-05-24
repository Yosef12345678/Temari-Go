import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  BusFront,
  CalendarMinus2,
  ChevronRight,
  CircleHelp,
  Clock3,
  GraduationCap,
  IdCard,
  MapPin,
  Route,
  School,
  Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAttendanceByStudent } from '@/src/hooks/useAttendance';
import { useBusCurrent, useBusHistory } from '@/src/hooks/useLocations';
import { useStudentDetail } from '@/src/hooks/useStudents';
import { useDriverFeedbackCreate } from '@/src/hooks/useDriverFeedback';
import { useCanRateDriver } from '@/src/hooks/useDriverFeedbackEligibility';
import type { BusLocationPoint } from '@/src/types/location';

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const q = useStudentDetail(String(id ?? ''));
  const student = (q.data?.student ?? {}) as Record<string, unknown>;
  const busId = String(student.busId ?? student.bus_id ?? '');
  const driverId = String(student.driver_id ?? student.driverId ?? '').trim() || null;
  const driverName = String(student.driver_name ?? student.driverName ?? '').trim() || t('childDetail.driver');
  const driverLabel = driverId ? `${driverName} (#${driverId})` : driverName;
  const current = useBusCurrent(busId, { refetchIntervalMs: 8_000 });
  const history = useBusHistory(busId, { limit: 6 });
  const attendance = useAttendanceByStudent(String(id ?? ''));
  const [tabValue, setTabValue] = React.useState('overview');
  const rateDriver = useDriverFeedbackCreate();
  const eligibility = useCanRateDriver(driverId);

  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
  const cardBackground = useThemeColor({}, 'background');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const emphasisBorder = useThemeColor({ light: '#bfdbfe', dark: '#1d4ed8' }, 'border');
  const emphasisBackground = useThemeColor({ light: '#eff6ff', dark: '#0f1d34' }, 'background');

  const studentName = String(student.full_name ?? t('students.fallbackStudent'));
  const schoolName = resolveSchoolName(student, t);
  const studentGrade = String(student.grade ?? '-');
  const studentCode = String(student.student_id ?? student.studentId ?? student.id ?? id ?? '-');
  const routeName = String(student.route_name ?? t('childDetail.notAssigned'));

  const homeLat = student.home_latitude;
  const homeLng = student.home_longitude;
  const hasHomeAddress = typeof homeLat === 'number' && typeof homeLng === 'number';
  const addressLabel = hasHomeAddress
    ? t('childDetail.homeCoords', { lat: Number(homeLat).toFixed(4), lng: Number(homeLng).toFixed(4) })
    : t('childDetail.defaultAddressMissing');

  const timeline = React.useMemo(() => {
    const historyPoints = (history.data ?? []) as BusLocationPoint[];
    const currentPoint = current.data
      ? [{ latitude: current.data.latitude, longitude: current.data.longitude, timestamp: String(current.data.timestamp ?? '') }]
      : [];
    return [...historyPoints, ...currentPoint]
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      .sort((a, b) => String(a.timestamp ?? '').localeCompare(String(b.timestamp ?? '')));
  }, [current.data, history.data]);

  const etaTimeLabel = React.useMemo(() => {
    if (!current.data?.timestamp) return t('childDetail.unavailable');
    const ts = new Date(String(current.data.timestamp));
    if (Number.isNaN(ts.getTime())) return t('childDetail.unavailable');
    return new Date(ts.getTime() + 5 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [current.data?.timestamp, t]);

  const attendanceSummary = React.useMemo(() => {
    const events = (attendance.data ?? []) as Record<string, unknown>[];
    const latest = events
      .map((item) => ({ type: String(item.type ?? '-'), ts: String(item.timestamp ?? item.createdAt ?? '') }))
      .sort((a, b) => b.ts.localeCompare(a.ts))[0];
    return latest
      ? t('attendance.summary', { type: latest.type, time: formatTimestamp(latest.ts, t) })
      : t('attendance.noEventsYet');
  }, [attendance.data, t]);

  const isRefreshing = q.isRefetching || current.isRefetching || history.isRefetching || attendance.isRefetching;
  const handleRefresh = React.useCallback(() => {
    void q.refetch();
    if (busId) {
      void current.refetch();
      void history.refetch();
    }
    void attendance.refetch();
    if (driverId) void eligibility.refetch();
  }, [attendance, busId, current, history, q, driverId, eligibility]);

  const handleRateDriver = React.useCallback(() => {
    if (!driverId) {
      Alert.alert(t('childDetail.driverUnavailableTitle'), t('childDetail.driverUnavailableBody'));
      return;
    }

    if (eligibility.data && !eligibility.data.canRate) {
      const when = eligibility.data.nextEligibleAt
        ? new Date(eligibility.data.nextEligibleAt).toLocaleDateString()
        : t('childDetail.unavailable');
      Alert.alert(t('childDetail.ratingAvailableLaterTitle'), t('childDetail.ratingAvailableLaterBody', { driverName: driverLabel, when }));
      return;
    }

    const submit = (rating: number) => {
      rateDriver.mutate(
        { driver_id: String(driverId), rating },
        {
          onSuccess: () => {
            Alert.alert(t('childDetail.thanksTitle'), t('childDetail.thanksBody', { driverName: driverLabel }));
            void eligibility.refetch();
          },
          onError: (err: any) => {
            const msg = err?.message ?? err?.response?.data?.message ?? t('childDetail.submitFailed');
            Alert.alert(t('childDetail.couldNotSubmitTitle'), String(msg));
            void eligibility.refetch();
          },
        }
      );
    };

    Alert.alert(t('childDetail.ratePromptTitle', { driverName: driverLabel }), t('childDetail.ratePromptBody'), [
      { text: '1', onPress: () => submit(1) },
      { text: '2', onPress: () => submit(2) },
      { text: '3', onPress: () => submit(3) },
      { text: '4', onPress: () => submit(4) },
      { text: '5', onPress: () => submit(5) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [driverId, driverLabel, eligibility, rateDriver, t]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title:
            studentName && studentName !== t('students.fallbackStudent')
              ? studentName
              : t('childDetail.screenTitleDefault'),
        }}
      />

      {q.isLoading ? <ThemedText>{t('childDetail.loadingStudent')}</ThemedText> : null}
      {q.error ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{(q.error as any)?.message ?? t('childDetail.failedGeneric')}</ThemedText> : null}

      {q.data ? (
        <Tabs value={tabValue} onValueChange={setTabValue} style={styles.tabsRoot}>
          <TabsList style={styles.tabsList}>
            <TabsTrigger value="overview">
              <ThemedText>{t('childDetail.overview')}</ThemedText>
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <ThemedText>{t('childDetail.routeTimeline')}</ThemedText>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" style={styles.tabContent}>
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
              <Card style={[styles.heroCard, { borderColor: emphasisBorder, backgroundColor: emphasisBackground }]}>
                <CardContent style={styles.heroBody}>
                  <View style={styles.heroText}>
                    <Badge variant="outline">
                      <ThemedText>{t('childDetail.studentProfile')}</ThemedText>
                    </Badge>
                    <ThemedText type="defaultSemiBold" style={styles.studentName}>
                      {studentName}
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: mutedText }]}>{schoolName}</ThemedText>
                  </View>
                  <Avatar className="size-16" alt={`${studentName} avatar`}>
                    <AvatarImage source={{ uri: String(student.avatar_url ?? student.avatarUrl ?? '') }} />
                    <AvatarFallback>
                      <ThemedText type="defaultSemiBold">{getInitials(studentName)}</ThemedText>
                    </AvatarFallback>
                  </Avatar>
                </CardContent>
              </Card>

              <View style={styles.kpiGrid}>
                <KpiCard icon={<BusFront color={iconColor} size={16} />} label={t('childDetail.kpiBus')} value={busId || t('childDetail.unassigned')} borderColor={borderColor} />
                <KpiCard icon={<Clock3 color={iconColor} size={16} />} label={t('childDetail.kpiEta')} value={etaTimeLabel} borderColor={borderColor} />
                <KpiCard icon={<Route color={iconColor} size={16} />} label={t('childDetail.kpiRoute')} value={routeName} borderColor={borderColor} />
                <KpiCard
                  icon={<CalendarMinus2 color={iconColor} size={16} />}
                  label={t('childDetail.kpiAttendance')}
                  value={attendanceSummary.slice(0, 24)}
                  borderColor={borderColor}
                />
              </View>

              <Card style={{ borderColor, backgroundColor: cardBackground }}>
                <CardHeader>
                  <CardTitle>{t('childDetail.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent style={styles.quickActions}>
                  <ActionRow
                    icon={<MapPin color={iconColor} size={18} />}
                    title={t('childDetail.viewLiveMap')}
                    onPress={() => router.push(`/children/${id}/tracking` as any)}
                    borderColor={borderColor}
                  />
                  <ActionRow
                    icon={<CalendarMinus2 color={iconColor} size={18} />}
                    title={t('childDetail.markAbsence')}
                    onPress={() => router.push(`/children/${id}/attendance` as any)}
                    borderColor={borderColor}
                  />
                  <ActionRow
                    icon={<Star color={iconColor} size={18} />}
                    title={
                      eligibility.data && !eligibility.data.canRate
                        ? t('childDetail.rateDriverLater')
                        : t('childDetail.rateDriver')
                    }
                    onPress={handleRateDriver}
                    borderColor={borderColor}
                    disabled={!driverId}
                  />
                  <ActionRow
                    icon={<CircleHelp color={iconColor} size={18} />}
                    title={t('childDetail.helpDesk')}
                    onPress={() => router.push('/modals/helpdesk' as any)}
                    borderColor={borderColor}
                  />
                </CardContent>
              </Card>

              <Card style={{ borderColor, backgroundColor: cardBackground }}>
                <CardHeader>
                  <CardTitle>{t('childDetail.studentInformation')}</CardTitle>
                </CardHeader>
                <CardContent style={styles.detailsGrid}>
                  <InfoTile icon={<IdCard color={iconColor} size={14} />} label={t('childDetail.studentId')} value={studentCode} borderColor={borderColor} />
                  <InfoTile icon={<GraduationCap color={iconColor} size={14} />} label={t('childDetail.grade')} value={studentGrade} borderColor={borderColor} />
                  <InfoTile
                    icon={<IdCard color={iconColor} size={14} />}
                    label={t('childDetail.driver')}
                    value={driverId ? driverLabel : t('childDetail.notAssigned')}
                    borderColor={borderColor}
                  />
                  <InfoTile
                    icon={<School color={iconColor} size={14} />}
                    label={t('childDetail.rollNumber')}
                    value={String(student.roll_number ?? '—')}
                    borderColor={borderColor}
                  />
                  <InfoTile icon={<Route color={iconColor} size={14} />} label={t('childDetail.section')} value={String(student.section ?? '—')} borderColor={borderColor} />
                </CardContent>
              </Card>

              <Card style={{ borderColor, backgroundColor: cardBackground }}>
                <CardHeader>
                  <CardTitle>{t('childDetail.locationSnapshot')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('childDetail.openDefaultAddress')}
                    style={[styles.addressRow, { borderColor }]}
                    onPress={async () => {
                      if (hasHomeAddress) {
                        await Linking.openURL(`https://maps.google.com/?q=${homeLat},${homeLng}`);
                        return;
                      }
                      Alert.alert(t('childDetail.addressUnavailableTitle'), t('childDetail.addressUnavailableBody'));
                    }}>
                    <View style={styles.addressTextArea}>
                      <Badge variant="outline">
                        <ThemedText>{t('childDetail.defaultAddress')}</ThemedText>
                      </Badge>
                      <ThemedText style={styles.addressText}>{addressLabel}</ThemedText>
                    </View>
                    <ChevronRight color={iconColor} size={18} />
                  </Pressable>
                </CardContent>
              </Card>
            </ScrollView>
          </TabsContent>

          <TabsContent value="timeline" style={styles.tabContent}>
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
              <Card style={{ borderColor, backgroundColor: cardBackground }}>
                <CardHeader style={styles.timelineTitleRow}>
                  <CardTitle>{t('childDetail.routeProgress')}</CardTitle>
                  <Badge variant="secondary">
                    <ThemedText>{busId ? t('childDetail.busLabel', { busId }) : t('childDetail.noBusAssigned')}</ThemedText>
                  </Badge>
                </CardHeader>
                <CardContent style={styles.timelineContent}>
                  <Progress value={timelineProgress(timeline)} />
                  {history.isLoading || current.isLoading ? <ThemedText>{t('childDetail.loadingRoute')}</ThemedText> : null}
                  {history.error || current.error ? (
                    <ThemedText style={[styles.errorText, { color: errorColor }]}>
                      {((history.error ?? current.error) as any)?.message ?? t('childDetail.failedRouteData')}
                    </ThemedText>
                  ) : null}
                  {timeline.map((point, idx) => (
                    <View key={`${point.timestamp ?? idx}-${idx}`} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View style={[styles.timelineDot, { backgroundColor: idx === timeline.length - 1 ? tint : iconColor }]} />
                        {idx < timeline.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: borderColor }]} /> : null}
                      </View>
                      <View style={styles.timelineText}>
                        <View style={styles.rowTitle}>
                          <BusFront color={iconColor} size={14} />
                          <ThemedText type="defaultSemiBold">
                            {t('childDetail.stopLabel', { index: idx + 1, coords: formatStopLabel(point) })}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ color: mutedText }}>{formatTimestamp(point.timestamp, t)}</ThemedText>
                      </View>
                    </View>
                  ))}
                  {timeline.length === 0 && !history.isLoading && !current.isLoading ? <ThemedText>{t('childDetail.noRoutePoints')}</ThemedText> : null}
                </CardContent>
              </Card>
            </ScrollView>
          </TabsContent>
        </Tabs>
      ) : null}
    </ThemedView>
  );
}

function KpiCard({
  icon,
  label,
  value,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderColor }]}>
      <View style={styles.kpiLabelRow}>
        {icon}
        <ThemedText style={styles.kpiLabel}>{label}</ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

function InfoTile({
  icon,
  label,
  value,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.infoTile, { borderColor }]}>
      <View style={styles.kpiLabelRow}>
        {icon}
        <ThemedText style={styles.kpiLabel}>{label}</ThemedText>
      </View>
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  onPress,
  borderColor,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  borderColor: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      style={[styles.actionRow, { borderColor }, disabled ? styles.actionRowDisabled : null]}
      onPress={onPress}>
      <View style={styles.actionLeft}>
        {icon}
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </View>
      <ChevronRight color={borderColor} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, paddingBottom: 0 },
  tabsRoot: { flex: 1 },
  tabsList: { marginBottom: 8 },
  tabContent: { flex: 1 },
  scrollBody: { gap: 12, paddingBottom: 36 },
  heroCard: { borderWidth: 1, borderRadius: 16 },
  heroBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroText: { gap: 6, flex: 1, paddingRight: 12 },
  studentName: { fontSize: 26, lineHeight: 30 },
  subtitle: { marginTop: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  kpiLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kpiLabel: { opacity: 0.72, fontSize: 12 },
  quickActions: { gap: 10 },
  actionRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionRowDisabled: { opacity: 0.55 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoTile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  addressRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressTextArea: { gap: 8, flexShrink: 1 },
  addressText: { opacity: 0.85 },
  timelineTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineContent: { gap: 12 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { width: 16, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 999, marginTop: 4 },
  timelineLine: { marginTop: 2, width: 2, flex: 1, minHeight: 40 },
  timelineText: { gap: 4, flex: 1, paddingBottom: 12 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 14 },
});

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.length > 0 ? parts.map((part) => part.charAt(0).toUpperCase()).join('') : 'S';
}

function formatStopLabel(point: BusLocationPoint) {
  return `${Number(point.latitude).toFixed(4)}, ${Number(point.longitude).toFixed(4)}`;
}

function resolveSchoolName(student: Record<string, unknown>, t: (key: string, options?: any) => string) {
  const routeAssignments = Array.isArray(student.routeAssignments) ? student.routeAssignments : Array.isArray(student.route_assignments) ? student.route_assignments : [];
  const firstAssignment = routeAssignments[0] as Record<string, unknown> | undefined;
  const route = (firstAssignment?.route ?? student.route) as Record<string, unknown> | undefined;
  const bus = (route?.bus ?? student.bus ?? student.assignedBus ?? student.assigned_bus) as Record<string, unknown> | undefined;
  const school = (bus?.school ?? student.school) as Record<string, unknown> | undefined;
  const value = String(student.school_name ?? student.schoolName ?? school?.name ?? school?.school_name ?? bus?.school_name ?? bus?.schoolName ?? student.school ?? '').trim();
  return value || t('childDetail.schoolNotAvailable');
}

function formatTimestamp(value: string | undefined, t: (key: string, options?: any) => string) {
  if (!value) return t('childDetail.timeUnavailable');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function timelineProgress(points: BusLocationPoint[]) {
  if (points.length <= 1) return 0;
  return Math.min(100, Math.round((points.length / 7) * 100));
}
