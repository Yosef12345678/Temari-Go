import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { driverRegister } from '@/api/auth';
import { unwrapData } from '@/api/envelope';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Email is required.';
  if (!/^\S+@\S+\.\S+$/.test(v)) return 'Enter a valid email address.';
  return null;
}

function validateName(name: string): string | null {
  return name.trim().length > 1 ? null : 'Name is required.';
}

export default function DriverRegistrationScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nameError = useMemo(() => validateName(name), [name]);
  const emailError = useMemo(() => validateEmail(email), [email]);
  const canSubmit = useMemo(
    () => !nameError && !emailError && !submitting,
    [emailError, nameError, submitting]
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await driverRegister({
        name: name.trim(),
        email: email.trim(),
        phone_number: phone_number.trim() ? phone_number.trim() : null,
        username: username.trim() ? username.trim() : null,
      });
      const payload = unwrapData(response);
      setSuccessMessage(payload.message || 'Application submitted. Pending admin verification.');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      subtitle="Driver Application"
      title="Apply to drive"
      description="Submit your details. An admin will verify your account and send you a setup link."
    >
      <View style={styles.field}>
        <ThemedText type="smallBold">Full name *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Full name"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
          editable={!submitting}
          autoCapitalize="words"
          returnKeyType="next"
        />
        {nameError ? <ThemedText style={styles.error}>{nameError}</ThemedText> : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Email *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="email@example.com"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          editable={!submitting}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
        />
        {emailError ? <ThemedText style={styles.error}>{emailError}</ThemedText> : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Phone number</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="+2519..."
          placeholderTextColor={theme.textSecondary}
          value={phone_number}
          onChangeText={setPhoneNumber}
          editable={!submitting}
          keyboardType="phone-pad"
          returnKeyType="next"
        />
        <ThemedText type="small" themeColor="textSecondary">
          Optional, but recommended.
        </ThemedText>
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Username</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="@username"
          placeholderTextColor={theme.textSecondary}
          value={username}
          onChangeText={setUsername}
          editable={!submitting}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        <ThemedText type="small" themeColor="textSecondary">
          Optional. Must be unique.
        </ThemedText>
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {successMessage ? (
        <ThemedText style={[styles.success, { color: theme.tint }]}>{successMessage}</ThemedText>
      ) : null}

      <Button
        disabled={!canSubmit}
        onPress={() => void handleSubmit()}
        label={submitting ? 'Submitting...' : 'Submit application'}
      />
      {submitting ? <ActivityIndicator /> : null}

      <Pressable disabled={submitting} onPress={() => router.push('/(auth)/login' as any)}>
        <ThemedText type="linkPrimary" style={styles.link}>
          Already have an account? Sign in
        </ThemedText>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  error: { color: '#c62828' },
  success: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
  link: { textAlign: 'center' },
});

