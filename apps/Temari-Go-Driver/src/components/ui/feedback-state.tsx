import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Inbox, TriangleAlert } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';

export function LoadingState({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <Card style={styles.stateCard}>
      <ActivityIndicator />
      <ThemedText themeColor="textSecondary" style={styles.centerText}>{message ?? t('loadingDefault')}</ThemedText>
    </Card>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  const theme = useTheme();

  return (
    <Card style={styles.stateCard}>
      <View style={[styles.iconWrap, { backgroundColor: `${theme.tint}16` }]}>
        <Inbox size={24} color={theme.tint} />
      </View>
      <ThemedText type="smallBold" style={styles.stateTitle}>{title}</ThemedText>
      {message ? <ThemedText themeColor="textSecondary" style={styles.centerText}>{message}</ThemedText> : null}
    </Card>
  );
}

export function ErrorState({ title, message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <Card style={styles.stateCard}>
      <View style={[styles.iconWrap, { backgroundColor: `${theme.destructive}16` }]}>
        <TriangleAlert size={24} color={theme.destructive} />
      </View>
      <ThemedText type="smallBold" style={styles.stateTitle}>{title ?? t('somethingWentWrong')}</ThemedText>
      {message ? <ThemedText themeColor="textSecondary" style={styles.centerText}>{message}</ThemedText> : null}
      {onRetry ? <Button label={t('tryAgain')} variant="outline" onPress={onRetry} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
