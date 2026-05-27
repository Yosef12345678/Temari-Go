import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { CalendarClock, CheckCircle2, Clock3, ListChecks, XCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useThemeColor } from '@/hooks/use-theme-color';
import { reportStudentAbsence } from '@/src/api/attendance';
import { useAttendanceByStudent } from '@/src/hooks/useAttendance';
import type { AttendanceEvent } from '@/src/types/attendance';

export default function ChildAttendanceScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useAttendanceByStudent(String(id ?? ''));
  const [absenceDate, setAbsenceDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showAbsenceForm, setShowAbsenceForm] = React.useState(false);
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const successColor = useThemeColor({ light: '#16a34a', dark: '#22c55e' }, 'tint');
  const warningColor = useThemeColor({ light: '#ea580c', dark: '#fb923c' }, 'icon');
  const softBackground = useThemeColor({ light: '#f8fafc', dark: '#111827' }, 'background');

  const attendanceEvents = React.useMemo(() => {
    return [...((q.data ?? []) as AttendanceEvent[])].sort((a, b) =>
      getEventTimestamp(b).localeCompare(getEventTimestamp(a))
    );
  }, [q.data]);

  const summary = React.useMemo(() => {
    return attendanceEvents.reduce(
      (acc, item) => {
        const kind = getEventKind(item);
        if (kind === 'boarding') acc.boarding += 1;
        else if (kind === 'exiting') acc.exiting += 1;
        else if (kind === 'absence') acc.absence += 1;
        else acc.other += 1;
        return acc;
      },
      { boarding: 0, exiting: 0, absence: 0, other: 0 }
    );
  }, [attendanceEvents]);

  const handleReportAbsence = React.useCallback(async () => {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await reportStudentAbsence({
        student_id: Number(id),
        absence_date: absenceDate,
        reason: reason.trim() || undefined,
      });
      setReason('');
      await q.refetch();
    } catch (error: any) {
      setSubmitError(error?.message ?? 'Could not report absence.');
    } finally {
      setSubmitting(false);
    }
  }, [absenceDate, id, q, reason]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('attendanceScreen.title') }} />
      <FlatList
        data={attendanceEvents}
        keyExtractor={(item, idx) => String(item.id ?? `${getEventTimestamp(item)}-${idx}`)}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={[styles.heroCard, { borderColor, backgroundColor: cardBackground }]}>
              <View style={[styles.heroIcon, { backgroundColor: tint }]}>
                <ListChecks color="#ffffff" size={24} />
              </View>
              <View style={styles.heroText}>
                <ThemedText type="title" style={styles.heroTitle}>{t('attendanceScreen.logTitle')}</ThemedText>
                <ThemedText style={{ color: mutedText }}>{t('attendanceScreen.logSubtitle')}</ThemedText>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryTile label={t('attendanceScreen.boarded')} value={summary.boarding} borderColor={borderColor} backgroundColor={softBackground} />
              <SummaryTile label={t('attendanceScreen.exited')} value={summary.exiting} borderColor={borderColor} backgroundColor={softBackground} />
              <SummaryTile label={t('attendanceScreen.absent')} value={summary.absence} borderColor={borderColor} backgroundColor={softBackground} />
            </View>

            <Button onPress={() => setShowAbsenceForm((value) => !value)}>
              <Text>{showAbsenceForm ? t('attendanceScreen.hideAbsenceForm') : t('attendanceScreen.showAbsenceForm')}</Text>
            </Button>

            {showAbsenceForm ? (
              <View style={[styles.formCard, { borderColor, backgroundColor: cardBackground }]}>
                <ThemedText type="defaultSemiBold">{t('attendanceScreen.reportAbsence')}</ThemedText>
                <ThemedText style={{ color: mutedText }}>{t('attendanceScreen.reportAbsenceSubtitle')}</ThemedText>
                <View style={styles.formField}>
                  <ThemedText type="defaultSemiBold">{t('attendanceScreen.date')}</ThemedText>
                  <Input value={absenceDate} onChangeText={setAbsenceDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
                </View>
                <View style={styles.formField}>
                  <ThemedText type="defaultSemiBold">{t('attendanceScreen.reasonOptional')}</ThemedText>
                  <Textarea value={reason} onChangeText={setReason} placeholder={t('attendanceScreen.reasonPlaceholder')} numberOfLines={3} />
                </View>
                {submitError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{submitError}</ThemedText> : null}
                <Button onPress={handleReportAbsence} disabled={submitting}>
                  <Text>{submitting ? t('attendanceScreen.submitting') : t('attendanceScreen.submitAbsence')}</Text>
                </Button>
              </View>
            ) : null}

            <View style={styles.sectionTitleRow}>
              <ThemedText type="subtitle">{t('attendanceScreen.recentLog')}</ThemedText>
              <Badge variant="secondary">
                <ThemedText>{t('attendanceScreen.recordsCount', { count: attendanceEvents.length })}</ThemedText>
              </Badge>
            </View>
            {q.isLoading ? <ThemedText>{t('common.loading')}</ThemedText> : null}
            {q.error ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{(q.error as any)?.message ?? t('attendanceScreen.failed')}</ThemedText> : null}
          </View>
        }
        renderItem={({ item }) => {
          const kind = getEventKind(item);
          const eventType = formatEventType(String(item.type ?? '-'));
          const eventTime = getEventTimestamp(item);
          const locationLabel = String(item.location ?? item.location_name ?? item.stopName ?? item.stop_name ?? '').trim();
          return (
            <View style={[styles.card, { borderColor, backgroundColor: softBackground }]}>
              <View style={styles.rowTop}>
                <View style={styles.titleRow}>
                  <EventIcon kind={kind} iconColor={iconColor} successColor={successColor} warningColor={warningColor} />
                  <ThemedText type="defaultSemiBold">{eventType}</ThemedText>
                </View>
                <View style={[
                  styles.badge,
                  kind === 'boarding' 
                    ? { backgroundColor: tint } 
                    : { backgroundColor: softBackground, borderColor }
                ]}>
                  <ThemedText style={kind === 'boarding' ? styles.badgeTextLight : styles.badgeTextDark}>
                    {getEventBadge(kind, t)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Clock3 color={mutedText} size={14} />
                <ThemedText style={{ color: mutedText }}>{formatTimestamp(eventTime, t)}</ThemedText>
              </View>
              <ThemedText>{t('attendanceScreen.busLabel', { busId: String(item.busId ?? item.bus_id ?? '-') })}</ThemedText>
              {locationLabel ? <ThemedText style={{ color: mutedText }}>{t('attendanceScreen.locationLabel', { location: locationLabel })}</ThemedText> : null}
            </View>
          );
        }}
        ListEmptyComponent={q.isLoading ? null : <ThemedText style={styles.emptyText}>{t('attendanceScreen.empty')}</ThemedText>}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  listContent: { paddingTop: 16, paddingBottom: 28 },
  headerContent: { gap: 12 },
  heroCard: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 24, lineHeight: 30 },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryTile: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 },
  summaryValue: { fontSize: 20, lineHeight: 24 },
  formCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  formField: { gap: 6 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8, marginBottom: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 12, opacity: 0.75 },
  errorText: { fontSize: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeTextLight: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  badgeTextDark: { fontSize: 12, fontWeight: '600' },
});

function SummaryTile({ label, value, borderColor, backgroundColor }: { label: string; value: number; borderColor: string; backgroundColor: string }) {
  return (
    <View style={[styles.summaryTile, { borderColor, backgroundColor }]}>
      <ThemedText style={{ opacity: 0.75 }}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.summaryValue}>{String(value)}</ThemedText>
    </View>
  );
}

function EventIcon({ kind, iconColor, successColor, warningColor }: { kind: string; iconColor: string; successColor: string; warningColor: string }) {
  if (kind === 'boarding') return <CheckCircle2 color={successColor} size={16} />;
  if (kind === 'absence') return <XCircle color={warningColor} size={16} />;
  return <CalendarClock color={iconColor} size={16} />;
}

function getEventKind(item: AttendanceEvent) {
  const type = String(item.type ?? '').toLowerCase();
  if (type.includes('board') || type.includes('pickup')) return 'boarding';
  if (type.includes('exit') || type.includes('drop')) return 'exiting';
  if (type.includes('absen')) return 'absence';
  return 'other';
}

function getEventBadge(kind: string, t: (k: string) => string) {
  if (kind === 'boarding') return t('attendanceScreen.pickup');
  if (kind === 'exiting') return t('attendanceScreen.dropoff');
  if (kind === 'absence') return t('attendanceScreen.absence');
  return t('attendanceScreen.dropOther');
}

function getEventTimestamp(item: AttendanceEvent) {
  return String(item.timestamp ?? item.createdAt ?? item.created_at ?? item.absence_date ?? '');
}

function formatEventType(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || '-';
}

function formatTimestamp(value: string, t: (k: string) => string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || t('attendanceScreen.timeUnavailable');
  return date.toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
