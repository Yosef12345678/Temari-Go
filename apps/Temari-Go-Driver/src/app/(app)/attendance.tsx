import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBusAttendance, getDriverAbsences, manualAttendance } from '@/api/attendance';
import { getMyJobs } from '@/api/driver';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { enqueue, readQueue, replaceQueue } from '@/sync/offline-queue';
import type { AttendanceSummary, AttendanceStudent, DriverAbsence } from '@/types/attendance';

export default function AttendanceScreen() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [busId, setBusId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<AttendanceStudent | null>(null);
  const [absences, setAbsences] = useState<DriverAbsence[]>([]);

  async function load() {
    const jobs = await getMyJobs('active');
    const inferredBus = jobs[0]?.bus_id ?? null;
    setBusId(inferredBus);
    if (inferredBus) {
      setSummary(await getBusAttendance(inferredBus));
      setAbsences(await getDriverAbsences());
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onManual() {
    if (!busId || !selectedStudent) return;
    const payload = { bus_id: busId, student_id: Number(selectedStudent.id), type: 'boarding' as const };
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      await enqueue({ kind: 'manual_attendance', payload });
      Alert.alert('Offline', 'Attendance queued and will sync when online.');
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

  const filteredStudents = (summary?.expectedStudents ?? []).filter((s) =>
    `${s.full_name} ${s.id}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ThemedText style={styles.title}>Attendance Dashboard</ThemedText>
      {!summary ? (
        <ThemedText>No active bus assignment found.</ThemedText>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText>Total expected: {summary.statistics.totalAssignedStudents}</ThemedText>
          <ThemedText>Onboard now: {summary.statistics.currentOnboardCount}</ThemedText>
          <ThemedText style={styles.missed}>Missed pickups: {summary.statistics.missedPickupCount}</ThemedText>
          <ThemedText>Parent-reported absences: {summary.statistics.reportedAbsentCount ?? 0}</ThemedText>
          <ThemedText style={styles.section}>Students</ThemedText>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search student by name or id"
            style={styles.input}
          />
          {filteredStudents.map((s) => (
            <Card key={s.id} style={styles.row}>
              <ThemedText>{s.full_name}</ThemedText>
              <ThemedText style={{ color: s.absent ? '#64748b' : s.boarded ? '#1b9e3f' : '#b3261e' }}>
                {s.absent ? 'Absent' : s.boarded ? 'Boarded' : 'Expected'}
              </ThemedText>
              <Button
                label={selectedStudent?.id === s.id ? 'Selected' : 'Select'}
                variant={selectedStudent?.id === s.id ? 'default' : 'outline'}
                onPress={() => setSelectedStudent(s)}
              />
            </Card>
          ))}
          <ThemedText style={styles.section}>Manual attendance</ThemedText>
          <ThemedText>{selectedStudent ? `Selected: ${selectedStudent.full_name}` : 'Select a student above'}</ThemedText>
          <Button label="Manual Check-In" onPress={onManual} />
          <Button label="Manual Check-Out" variant="outline" onPress={onManualExit} />
          <Button label="Sync Buffered Data" variant="outline" onPress={flushQueue} />
          <ThemedText style={styles.section}>Parent Absence Alerts</ThemedText>
          {absences.map((item) => (
            <Card key={item.id}>
              <ThemedText>{item.student_name ?? `Student ${item.student_id}`} - {item.absence_date}</ThemedText>
              {item.reason ? <ThemedText type="small" themeColor="textSecondary">{item.reason}</ThemedText> : null}
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  content: { gap: 8, paddingBottom: 20 },
  section: { marginTop: 10, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#c8d4e6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  missed: { color: '#b3261e', fontWeight: '700' },
});
