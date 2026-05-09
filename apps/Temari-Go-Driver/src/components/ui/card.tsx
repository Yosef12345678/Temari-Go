import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme();
  return <View style={[styles.base, { backgroundColor: theme.background, borderColor: theme.border }, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
});
