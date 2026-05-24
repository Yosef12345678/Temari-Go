import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenShellProps = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function ScreenShell({ title, subtitle, action, children, scroll = true, contentStyle }: ScreenShellProps) {
  const theme = useTheme();
  const content = (
    <>
      {title || subtitle || action ? (
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            {title ? <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText> : null}
            {subtitle ? <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</ThemedText> : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{content}</ScrollView>
      ) : (
        <View style={[styles.content, styles.flexContent, contentStyle]}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  flexContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
