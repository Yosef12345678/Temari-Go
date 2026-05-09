import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<StatusTone, string> = {
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
  neutral: '#64748b',
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  const color = TONES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}>
      <ThemedText type="smallBold" style={[styles.text, { color }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
});
