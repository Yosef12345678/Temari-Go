import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';

import { triggerSOS } from '@/api/safety';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScreenShell } from '@/components/ui/screen-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { useI18n } from '@/hooks/use-i18n';
import { Spacing } from '@/constants/theme';

export default function SafetyScreen() {
  const { t } = useI18n();
  const [sosSending, setSosSending] = useState(false);

  async function sendSos() {
    Alert.alert(t('sendSosTitle'), t('sendSosMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('sendSos'),
        style: 'destructive',
        onPress: async () => {
          setSosSending(true);
          try {
            await triggerSOS({ reason: 'Driver emergency request' });
            Alert.alert(t('sosSent'), t('sosDispatched'));
          } catch (e: any) {
            Alert.alert(t('unableToSendSos'), e?.message ?? t('pleaseTryAgain'));
          } finally {
            setSosSending(false);
          }
        },
      },
    ]);
  }

  return (
    <ScreenShell title={t('safetyEmergency')} subtitle={t('safetySubtitle')}>
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <ShieldAlert size={28} color="#d97706" />
          <View style={styles.statusCopy}>
            <ThemedText type="smallBold">{t('preRouteBreathCheckRequired')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{t('tapReadyOnRoute')}</ThemedText>
          </View>
          <StatusBadge label={t('espOnly')} tone="warning" />
        </View>
      </Card>
      <Card style={styles.card}>
        <ThemedText type="smallBold">{t('preShiftBreathTest')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('manualBacDisabled')}</ThemedText>
      </Card>
      <Card style={styles.card}>
        <ThemedText type="smallBold">{t('emergency')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('useSosOnly')}</ThemedText>
        <Button disabled={sosSending} onPress={sendSos} variant="destructive" label={sosSending ? t('sendingSos') : t('sosPanicAlert')} />
        <ThemedText type="small" themeColor="textSecondary">{t('speedAlertsRealtime')}</ThemedText>
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
