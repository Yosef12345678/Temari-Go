import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';

import { triggerSOS } from '@/api/safety';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing } from '@/constants/theme';

export default function SafetyScreen() {
  const [sosSending, setSosSending] = useState(false);

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
          <ShieldAlert size={28} color="#d97706" />
          <View style={styles.statusCopy}>
            <ThemedText type="smallBold">Pre-route breath check required</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Tap Ready on your route to open the ESP capture window.</ThemedText>
          </View>
          <StatusBadge label="ESP only" tone="warning" />
        </View>
      </Card>
      <Card style={styles.card}>
        <ThemedText type="smallBold">Pre-shift breath test</ThemedText>
        <ThemedText themeColor="textSecondary">Manual BAC entry is disabled. The ESP device submits the reading during the one-minute route readiness window.</ThemedText>
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
