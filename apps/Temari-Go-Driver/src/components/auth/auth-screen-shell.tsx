import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';

type AuthScreenShellProps = {
  subtitle: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AuthScreenShell({ subtitle, title, description, children }: AuthScreenShellProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <ThemedView style={styles.root}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.brandWrap}>
            <ThemedText type="subtitle">{subtitle}</ThemedText>
            <ThemedText type="title" style={styles.brandTitle}>Temari Go</ThemedText>
          </View>
          <Card>
            <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
            {description ? <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText> : null}
            {children}
          </Card>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.three, gap: Spacing.three },
  brandWrap: { alignItems: 'center', gap: Spacing.two },
  brandTitle: { fontSize: 30, lineHeight: 34 },
  title: { fontSize: 24, lineHeight: 30 },
});
