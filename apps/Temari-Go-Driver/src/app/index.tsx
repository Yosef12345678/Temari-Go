import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Temari Driver API Foundation</ThemedText>
        <ThemedText type="small">
          API services, auth session handling, and backend driver endpoints are wired. UI flows are intentionally deferred.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
