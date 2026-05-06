import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PaymentWebViewModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();
  const borderColor = useThemeColor({}, 'border');

  const url = useMemo(() => {
    const u = params.url;
    return typeof u === 'string' ? u : '';
  }, [params.url]);

  const resolveStatus = (nextUrl: string) => {
    const lowered = nextUrl.toLowerCase();
    if (lowered.includes('success') || lowered.includes('status=completed') || lowered.includes('status=success')) {
      return 'success';
    }
    if (lowered.includes('cancel') || lowered.includes('status=cancelled')) {
      return 'cancelled';
    }
    if (lowered.includes('failed') || lowered.includes('error') || lowered.includes('status=failed')) {
      return 'failed';
    }
    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText type="defaultSemiBold">Chapa Checkout</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <ThemedText type="link">Close</ThemedText>
        </Pressable>
      </View>

      {!url ? (
        <View style={styles.empty}>
          <ThemedText>No checkout URL provided.</ThemedText>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          startInLoadingState
          onNavigationStateChange={(state) => {
            const status = resolveStatus(state.url);
            if (!status) return;
            router.replace({ pathname: '/(tabs)/billing', params: { paymentStatus: status } } as any);
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeButton: { paddingVertical: 6, paddingHorizontal: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

