import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyJobs } from '@/api/driver';
import { submitAlcoholTest, triggerSOS } from '@/api/safety';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SafetyScreen() {
  const [busId, setBusId] = useState<number | null>(null);
  const [bacInput, setBacInput] = useState('0.00');
  const [lockout, setLockout] = useState(false);
  const [status, setStatus] = useState<string>('No test submitted yet.');

  useEffect(() => {
    getMyJobs('active')
      .then((jobs) => setBusId(jobs[0]?.bus_id ?? null))
      .catch(() => undefined);
  }, []);

  const cleared = useMemo(() => !lockout, [lockout]);

  async function runTest() {
    if (!busId) return;
    const level = Number(bacInput);
    const result = await submitAlcoholTest({ bus_id: busId, alcohol_level: level });
    const blocked = !result.passed;
    setLockout(blocked);
    setStatus(blocked ? 'Do not operate vehicle' : 'Cleared to drive');
    if (blocked) {
      Alert.alert('Safety lock', 'BAC above threshold. Trip actions are locked.');
    }
  }

  async function sendSos() {
    await triggerSOS({ reason: 'Driver emergency request' });
    Alert.alert('SOS sent', 'Emergency alert was dispatched to admin.');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ThemedText style={styles.title}>Safety & Emergency</ThemedText>
      <Card style={styles.card}>
        <ThemedText style={styles.label}>Pre-shift breath test</ThemedText>
        <TextInput value={bacInput} onChangeText={setBacInput} keyboardType="decimal-pad" style={styles.input} />
        <Button onPress={runTest} label="Submit Test" />
        <ThemedText style={[styles.status, { color: cleared ? '#1b9e3f' : '#b3261e' }]}>{status}</ThemedText>
        <ThemedText>Trip controls: {cleared ? 'Enabled' : 'Locked'}</ThemedText>
      </Card>
      <Card style={styles.card}>
        <ThemedText style={styles.label}>Emergency</ThemedText>
        <Button onPress={sendSos} variant="destructive" label="SOS / Panic Alert" />
        <ThemedText style={styles.meta}>Speed and unsafe-motion alerts are delivered in realtime via notifications.</ThemedText>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  card: { gap: 8 },
  label: { fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#c8d4e6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  status: { fontWeight: '700' },
  meta: { color: '#455a64' },
});
