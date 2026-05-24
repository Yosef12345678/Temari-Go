import NetInfo from '@react-native-community/netinfo';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ClipboardCheck, UserCheck, UserMinus, UsersRound } from 'lucide-react-native';

import { manualAttendance } from '@/api/attendance';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/feedback-state';
import { MetricCard } from '@/components/ui/metric-card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useDriverAttendance } from '@/hooks/use-driver-attendance';
import { enqueue, readQueue, replaceQueue } from '@/sync/offline-queue';
import type { AttendanceStudent } from '@/types/attendance';

export default function AttendanceScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<AttendanceStudent | null>(null);
  const { summary, busId, absences, loading, error, filteredStudents, load } = useDriverAttendance(search);

  async function onManual() {
    if (!busId || !selectedStudent) return;
    const payload = { bus_id: busId, student_id: Number(selectedStudent.id), type: 'boarding' as const };
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      await enqueue({ kind: 'manual_attendance', payload });
      Alert.alert(t('offline'), t('attendanceQueued'));
      return;
    }
    await manualAttendance(payload);
    await load();
  }

  async function flushQueue() {
    const queue = await readQueue();
    const rest: typeof queue = [];
    for (const item of queue) {
      try {
        if (item.kind === 'manual_attendance') await manualAttendance(item.payload as any);
      } catch {
        rest.push(item);
      }
    }
    await replaceQueue(rest);
    await load();
  }

  async function onManualExit() {
    if (!busId || !selectedStudent) return;
    const payload = { bus_id: busId, student_id: Number(selectedStudent.id), type: 'exiting' as const };
    await manualAttendance(payload);
    await load();
  }

  return (
    <ScreenShell title={t('attendance')} subtitle={summary ? `${t('busNumber', { number: summary.bus.bus_number })} · ${summary.date}` : t('attendanceSubtitle')}>
      {loading ? <LoadingState message={t('loadingAttendance')} /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && !summary ? (
        <EmptyState title={t('noActiveBusAssignment')} message={t('attendanceToolsDescription')} />
      ) : null}
      {!loading && !error && summary ? (
        <>
          <View style={styles.metrics}>
            <MetricCard icon={UsersRound} label={t('expected')} value={summary.statistics.totalAssignedStudents} />
            <MetricCard icon={UserCheck} label={t('onboard')} value={summary.statistics.currentOnboardCount} tone="success" />
            <MetricCard icon={UserMinus} label={t('missed')} value={summary.statistics.missedPickupCount} tone="danger" />
            <MetricCard icon={ClipboardCheck} label={t('absences')} value={summary.statistics.reportedAbsentCount ?? 0} tone="warning" />
          </View>
          <TextField value={search} onChangeText={setSearch} placeholder={t('searchStudent')} label={t('students')} />
          {filteredStudents.length === 0 ? (
            <EmptyState title={t('noStudentsFound')} message={t('tryDifferentSearch')} />
          ) : filteredStudents.map((student) => (
            <Card key={student.id} style={styles.studentCard}>
              <View style={styles.studentCopy}>
                <ThemedText type="smallBold">{student.full_name}</ThemedText>
                {student.grade ? <ThemedText type="small" themeColor="textSecondary">{t('grade', { grade: student.grade })}</ThemedText> : null}
              </View>
              <StatusBadge
                label={student.absent ? t('absent') : student.boarded ? t('boarded') : t('expected')}
                tone={student.absent ? 'neutral' : student.boarded ? 'success' : 'warning'}
              />
              <Button
                label={selectedStudent?.id === student.id ? t('selected') : t('select')}
                variant={selectedStudent?.id === student.id ? 'default' : 'outline'}
                onPress={() => setSelectedStudent(student)}
              />
            </Card>
          ))}
          <Card style={styles.manualCard}>
            <ThemedText type="smallBold">{t('manualAttendance')}</ThemedText>
            <ThemedText themeColor="textSecondary">{selectedStudent ? `${t('selected')}: ${selectedStudent.full_name}` : t('selectStudentForManual')}</ThemedText>
            <View style={styles.actions}>
              <Button style={styles.action} disabled={!selectedStudent} label={t('checkIn')} onPress={onManual} />
              <Button style={styles.action} disabled={!selectedStudent} label={t('checkOut')} variant="outline" onPress={onManualExit} />
              <Button style={styles.action} label={t('syncQueue')} variant="outline" onPress={flushQueue} />
            </View>
          </Card>
          <ThemedText type="smallBold" style={styles.section}>{t('parentAbsenceAlerts')}</ThemedText>
          {absences.length === 0 ? (
            <EmptyState title={t('noParentAbsences')} message={t('reportedAbsencesAppearHere')} />
          ) : absences.map((item) => (
            <Card key={item.id} style={styles.absenceCard}>
              <ThemedText type="smallBold">{item.student_name ?? `${t('student')} ${item.student_id}`}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{item.absence_date}</ThemedText>
              {item.reason ? <ThemedText>{item.reason}</ThemedText> : null}
            </Card>
          ))}
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  studentCopy: { flex: 1 },
  manualCard: { gap: Spacing.three },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  action: { flexGrow: 1, minWidth: 110 },
  section: { fontSize: 17 },
  absenceCard: { gap: 4 },
});
