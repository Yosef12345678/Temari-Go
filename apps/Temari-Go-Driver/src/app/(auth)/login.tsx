import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session-context';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();

  const canSubmit = useMemo(
    () => emailOrUsername.trim().length > 0 && password.length >= 1 && !loading,
    [emailOrUsername, password, loading]
  );

  async function onSubmit() {
    if (!canSubmit) return;
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
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Email or Username"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
        editable={!loading}
        returnKeyType="next"
      />

      <View style={styles.passwordWrap}>
        <TextInput
          style={[styles.input, styles.passwordInput, { borderColor: theme.border, color: theme.text }]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          onPress={() => setShowPassword((prev) => !prev)}
          style={styles.eyeButton}
        >
          {showPassword ? <EyeOff size={18} color={theme.icon} /> : <Eye size={18} color={theme.icon} />}
        </Pressable>
      </View>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <Button
        disabled={!canSubmit}
        onPress={onSubmit}
        label={loading ? 'Signing in...' : 'Sign In'}
      />
      {loading ? <ActivityIndicator /> : null}

      <Pressable disabled={loading} onPress={() => router.push('/(auth)/register' as any)}>
        <ThemedText type="linkPrimary" style={styles.link}>
          New driver? Apply to drive
        </ThemedText>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 40 },
  eyeButton: { position: 'absolute', right: 12, top: '50%', transform: [{ translateY: -9 }] },
  error: { color: '#c62828' },
  link: { textAlign: 'center' },
});
