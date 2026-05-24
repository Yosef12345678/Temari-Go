import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppBrand } from '@/components/app-brand';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';

type AuthScreenShellProps = {
  subtitle: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AuthScreenShell({ subtitle, title, description, children }: AuthScreenShellProps) {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <ThemedView style={styles.root}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={[styles.hero, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <AppBrand subtitle={subtitle} />
            <View style={styles.heroCopy}>
              <ThemedText type="smallBold" style={{ color: theme.tint }}>{t('driverSecureAccess')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.heroText}>
                {t('driverConsoleDescription')}
              </ThemedText>
            </View>
          </View>
          <Card style={styles.card}>
            <View style={styles.heading}>
              <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
              {description ? <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText> : null}
            </View>
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
  hero: { borderWidth: 1, borderRadius: 28, padding: Spacing.four, gap: Spacing.three },
  heroCopy: { alignItems: 'center', gap: 4 },
  heroText: { textAlign: 'center', lineHeight: 20 },
  card: { gap: Spacing.three, padding: Spacing.four, borderRadius: 24 },
  heading: { gap: 4 },
  title: { fontSize: 24, lineHeight: 30 },
});
