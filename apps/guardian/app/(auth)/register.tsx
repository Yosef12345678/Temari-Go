import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppBrand } from '@/components/app-brand';
import { useAuth } from '@/src/hooks/useAuth';
import { useThemeColor } from '@/hooks/use-theme-color';
import { validateLanguagePreference, validatePhone } from '@/src/utils/validators';

function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Email is required.';
  // Simple and permissive email validation for UX.
  if (!/^\S+@\S+\.\S+$/.test(v)) return 'Enter a valid email address.';
  return null;
}

export default function ParentRegistrationScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [language_preference, setLanguagePreference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError = useMemo(() => (name.trim() ? null : 'Name is required.'), [name]);
  const emailError = useMemo(() => validateEmail(email), [email]);
  const passwordError = useMemo(
    () => (password.length >= 6 ? null : 'Password must be at least 6 characters.'),
    [password]
  );
  const phoneError = useMemo(() => validatePhone(phone_number), [phone_number]);
  const langError = useMemo(() => validateLanguagePreference(language_preference), [language_preference]);

  const canSubmit = useMemo(
    () =>
      !nameError && !emailError && !passwordError && !phoneError && !langError && password.length > 0 && !submitting,
    [emailError, langError, nameError, passwordError, password.length, phoneError, submitting]
  );

  return (
    <ThemedView style={styles.container}>
      <AppBrand subtitle="Parent Registration" />
      <ThemedText>Sign up and set the details required to continue.</ThemedText>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Name *</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
          autoCapitalize="words"
        />
        {nameError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{nameError}</ThemedText> : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Email *</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        {emailError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{emailError}</ThemedText> : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Password *</ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
          autoCapitalize="none"
        />
        {passwordError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{passwordError}</ThemedText> : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Phone number *</ThemedText>
        <TextInput
          value={phone_number}
          onChangeText={setPhoneNumber}
          placeholder="+2519..."
          keyboardType="phone-pad"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
        />
        {phoneError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{phoneError}</ThemedText> : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Language preference *</ThemedText>
        <TextInput
          value={language_preference}
          onChangeText={setLanguagePreference}
          placeholder="e.g. en"
          autoCapitalize="none"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
        />
        {langError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{langError}</ThemedText> : null}
      </View>

      {error ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{error}</ThemedText> : null}

      <Pressable
        disabled={!canSubmit}
        onPress={async () => {
          setSubmitting(true);
          setError(null);
          try {
            await register({
              name: name.trim(),
              email: email.trim(),
              password,
              phone_number: phone_number.trim(),
              language_preference: language_preference.trim(),
            });
            // Auth gate will redirect to home on successful login.
          } catch (e: any) {
            setError(e?.message ?? 'Registration failed');
          } finally {
            setSubmitting(false);
          }
        }}
        style={[styles.button, { backgroundColor: tint }, !canSubmit && styles.buttonDisabled]}
      >
        <ThemedText type="defaultSemiBold">{submitting ? 'Creating account…' : 'Create account'}</ThemedText>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/login' as any)} style={styles.linkButton}>
        <ThemedText type="link">Already have an account? Sign in</ThemedText>
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
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 14,
  },
});

