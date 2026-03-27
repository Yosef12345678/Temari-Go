import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppBrand } from '@/components/app-brand';
import { useAuth } from '@/src/hooks/useAuth';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => emailOrUsername.trim().length > 0 && password.length >= 1 && !submitting,
    [emailOrUsername, password, submitting]
  );

  return (
    <ThemedView style={styles.container}>
      <AppBrand subtitle="Parent Login" />

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Email or Username</ThemedText>
        <TextInput
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="email@example.com"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Password</ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
        />
      </View>

      {error ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{error}</ThemedText> : null}

      <Pressable
        disabled={!canSubmit}
        onPress={async () => {
          setSubmitting(true);
          setError(null);
          try {
            await login({ emailOrUsername: emailOrUsername.trim(), password });
          } catch (e: any) {
            setError(e?.message ?? 'Login failed');
          } finally {
            setSubmitting(false);
          }
        }}
        style={[styles.button, { backgroundColor: tint }, !canSubmit && styles.buttonDisabled]}>
        <ThemedText type="defaultSemiBold">{submitting ? 'Signing in…' : 'Sign in'}</ThemedText>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/register' as any)} style={styles.linkButton}>
        <ThemedText type="link">New here? Create an account</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 14,
    justifyContent: 'center',
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 14,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});

