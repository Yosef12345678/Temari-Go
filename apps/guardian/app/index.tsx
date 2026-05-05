import { Redirect } from 'expo-router';

/**
 * Cold start / dev client often opens `guardian:///` (empty path). Without this
 * file, Expo Router shows "Unmatched Route". We enter the main stack here;
 * `AuthGate` in `_layout.tsx` sends unauthenticated users to login.
 */
export default function Index() {
  return <Redirect href="/(tabs)/children" />;
}
