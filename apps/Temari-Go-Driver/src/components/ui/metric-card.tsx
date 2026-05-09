import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: 'info' | 'success' | 'warning' | 'danger';
};

const TONES = {
  info: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
};

export function MetricCard({ label, value, icon: Icon, tone = 'info' }: MetricCardProps) {
  const theme = useTheme();
  const color = TONES[tone];

  return (
    <Card style={styles.card}>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${color}16` }]}> 
          <Icon size={18} color={color} />
        </View>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold" style={[styles.value, { color: theme.text }]}>{value}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
    gap: 5,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
  },
});
