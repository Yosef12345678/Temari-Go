import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput } from 'react-native';

import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useSession } from '@/state/session-context';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      await signIn({ emailOrUsername, password });
      router.replace('/(app)/route');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenShell
      subtitle="Driver Portal"
      title="Sign In"
      description="Use your assigned driver account credentials to continue."
    >
      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        autoCapitalize="none"
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <Button
        disabled={loading}
        onPress={onSubmit}
        label={loading ? 'Signing in...' : 'Sign In'}
      />
      {loading ? <ActivityIndicator /> : null}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#c8d4e6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  error: { color: '#c62828' },
});
