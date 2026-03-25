import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';

const transportLogo = require('@/assets/images/transport.svg');

export function AppBrand(props: { subtitle?: string }) {
  const { subtitle } = props;

  return (
    <View style={styles.wrap}>
      <Image source={transportLogo} style={styles.logo} contentFit="contain" />
      <ThemedText type="title" style={styles.name}>
        Temari Go
      </ThemedText>
      {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  logo: {
    width: 72,
    height: 72,
  },
  name: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.85,
  },
});

