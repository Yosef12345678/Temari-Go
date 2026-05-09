import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { CalendarClock, CheckCircle2 } from 'lucide-react-native';
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

export default function ChildAttendanceScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useAttendanceByStudent(String(id ?? ''));
  const [absenceDate, setAbsenceDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');

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
      <View style={[styles.formCard, { borderColor, backgroundColor: cardBackground }]}>
        <ThemedText type="defaultSemiBold">Report Absence</ThemedText>
        <ThemedText style={{ color: mutedText }}>
          Tell the driver your child will not ride today.
        </ThemedText>
        <View style={styles.formField}>
          <ThemedText type="defaultSemiBold">Date</ThemedText>
          <Input value={absenceDate} onChangeText={setAbsenceDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        </View>
        <View style={styles.formField}>
          <ThemedText type="defaultSemiBold">Reason (optional)</ThemedText>
          <Textarea value={reason} onChangeText={setReason} placeholder="Sick leave, family event..." numberOfLines={3} />
        </View>
        {submitError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{submitError}</ThemedText> : null}
        <Button onPress={handleReportAbsence} disabled={submitting}>
          <Text>{submitting ? 'Submitting...' : 'Submit absence'}</Text>
        </Button>
      </View>
      {q.isLoading ? <ThemedText>{t('common.loading')}</ThemedText> : null}
      {q.error ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{(q.error as any)?.message ?? t('attendanceScreen.failed')}</ThemedText> : null}
      <FlatList
        data={(q.data ?? []) as any[]}
        keyExtractor={(item: any, idx) => String(item.id ?? idx)}
        refreshing={q.isRefetching}
        onRefresh={() => void q.refetch()}
        renderItem={({ item }: any) => {
          const eventType = String(item.type ?? '-');
          const isBoard = eventType.toLowerCase().includes('board');
          return (
            <View style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <View style={styles.rowTop}>
                <View style={styles.titleRow}>
                  {isBoard ? <CheckCircle2 color={iconColor} size={16} /> : <CalendarClock color={iconColor} size={16} />}
                  <ThemedText type="defaultSemiBold">{eventType}</ThemedText>
                </View>
                <Badge variant={isBoard ? 'default' : 'secondary'}>
                  <ThemedText>{isBoard ? t('attendanceScreen.pickup') : t('attendanceScreen.dropOther')}</ThemedText>
                </Badge>
              </View>
              <ThemedText style={{ color: mutedText }}>{formatTimestamp(String(item.timestamp ?? item.createdAt ?? ''), t)}</ThemedText>
              <ThemedText>{t('attendanceScreen.busLabel', { busId: String(item.busId ?? item.bus_id ?? '-') })}</ThemedText>
            </View>
          );
        }}
        ListEmptyComponent={q.isLoading ? null : <ThemedText>{t('attendanceScreen.empty')}</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  formCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  formField: { gap: 6 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8, marginBottom: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  errorText: { fontSize: 14 },
});

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
