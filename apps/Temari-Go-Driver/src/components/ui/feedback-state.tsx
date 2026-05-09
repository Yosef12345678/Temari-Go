import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Inbox, TriangleAlert } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <Card style={styles.stateCard}>
      <ActivityIndicator />
      <ThemedText themeColor="textSecondary" style={styles.centerText}>{message}</ThemedText>
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

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  const theme = useTheme();

  return (
    <Card style={styles.stateCard}>
      <View style={[styles.iconWrap, { backgroundColor: `${theme.destructive}16` }]}>
        <TriangleAlert size={24} color={theme.destructive} />
      </View>
      <ThemedText type="smallBold" style={styles.stateTitle}>{title}</ThemedText>
      {message ? <ThemedText themeColor="textSecondary" style={styles.centerText}>{message}</ThemedText> : null}
      {onRetry ? <Button label="Try again" variant="outline" onPress={onRetry} /> : null}
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
