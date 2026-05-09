import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ShieldAlert, ShieldCheck } from 'lucide-react-native';

import { getMyJobs } from '@/api/driver';
import { submitAlcoholTest, triggerSOS } from '@/api/safety';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

export default function SafetyScreen() {
  const [busId, setBusId] = useState<number | null>(null);
  const [bacInput, setBacInput] = useState('0.00');
  const [lockout, setLockout] = useState(false);
  const [status, setStatus] = useState<string>('No test submitted yet.');
  const [submitting, setSubmitting] = useState(false);
  const [sosSending, setSosSending] = useState(false);

  useEffect(() => {
    getMyJobs('active')
      .then((jobs) => setBusId(jobs[0]?.bus_id ?? null))
      .catch(() => undefined);
  }, []);

  const cleared = useMemo(() => !lockout, [lockout]);
  const bacLevel = Number(bacInput);
  const bacError = Number.isNaN(bacLevel) || bacLevel < 0 ? 'Enter a valid BAC reading.' : null;

  async function runTest() {
    if (!busId || bacError) return;
    setSubmitting(true);
    try {
      const result = await submitAlcoholTest({ bus_id: busId, alcohol_level: bacLevel });
      const blocked = !result.passed;
      setLockout(blocked);
      setStatus(blocked ? 'Do not operate vehicle' : 'Cleared to drive');
      if (blocked) {
        Alert.alert('Safety lock', 'BAC above threshold. Trip actions are locked.');
      }
    } catch (e: any) {
      Alert.alert('Unable to submit test', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function sendSos() {
    Alert.alert('Send SOS?', 'This will notify dispatch and administrators immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: async () => {
          setSosSending(true);
          try {
            await triggerSOS({ reason: 'Driver emergency request' });
            Alert.alert('SOS sent', 'Emergency alert was dispatched to admin.');
          } catch (e: any) {
            Alert.alert('Unable to send SOS', e?.message ?? 'Please try again.');
          } finally {
            setSosSending(false);
          }
        },
      },
    ]);
  }

  return (
    <ScreenShell title="Safety & Emergency" subtitle="Complete safety checks and contact dispatch quickly.">
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          {cleared ? <ShieldCheck size={28} color="#16a34a" /> : <ShieldAlert size={28} color="#dc2626" />}
          <View style={styles.statusCopy}>
            <ThemedText type="smallBold">{status}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Trip controls are {cleared ? 'enabled' : 'locked'}.</ThemedText>
          </View>
          <StatusBadge label={cleared ? 'Clear' : 'Locked'} tone={cleared ? 'success' : 'danger'} />
        </View>
      </Card>
      <Card style={styles.card}>
        <ThemedText type="smallBold">Pre-shift breath test</ThemedText>
        <TextField
          value={bacInput}
          onChangeText={setBacInput}
          keyboardType="decimal-pad"
          label="BAC reading"
          placeholder="0.00"
          error={bacError}
          helperText={busId ? 'Submit your current breath test result.' : 'Waiting for an active bus assignment.'}
        />
        <Button disabled={!busId || !!bacError || submitting} onPress={runTest} label={submitting ? 'Submitting...' : 'Submit Test'} />
      </Card>
      <Card style={styles.card}>
        <ThemedText type="smallBold">Emergency</ThemedText>
        <ThemedText themeColor="textSecondary">Use SOS only for urgent route, medical, or vehicle safety events.</ThemedText>
        <Button disabled={sosSending} onPress={sendSos} variant="destructive" label={sosSending ? 'Sending SOS...' : 'SOS / Panic Alert'} />
        <ThemedText type="small" themeColor="textSecondary">Speed and unsafe-motion alerts are delivered in realtime via notifications.</ThemedText>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statusCard: { padding: Spacing.four },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  statusCopy: { flex: 1 },
  card: { gap: Spacing.three },
});
