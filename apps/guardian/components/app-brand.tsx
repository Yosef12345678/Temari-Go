import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';

const transportLogo = require('@/assets/images/transport.svg');

type AppBrandProps = {
  subtitle?: string;
  compact?: boolean;
};

export function AppBrand({ subtitle, compact = false }: AppBrandProps) {
  return (
    <View style={[styles.wrap, compact && styles.compactWrap]}>
      <Image source={transportLogo} style={[styles.logo, compact && styles.compactLogo]} contentFit="contain" />
      <View style={compact ? styles.compactCopy : styles.copy}>
        <ThemedText type="title" style={[styles.name, compact && styles.compactName]}>
          Temari Go
        </ThemedText>
        {subtitle ? <ThemedText style={[styles.subtitle, compact && styles.compactSubtitle]}>{subtitle}</ThemedText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  compactWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 72,
    height: 72,
  },
  compactLogo: {
    width: 48,
    height: 48,
  },
  copy: {
    alignItems: 'center',
    gap: 2,
  },
  compactCopy: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: 'bold',
  },
  compactName: {
    fontSize: 22,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.85,
  },
  compactSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});

