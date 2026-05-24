import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { driverRegister } from '@/api/auth';
import { unwrapData } from '@/api/envelope';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';

function validateEmail(email: string, t: ReturnType<typeof useI18n>['t']): string | null {
  const v = email.trim();
  if (!v) return t('emailIsRequired');
  if (!/^\S+@\S+\.\S+$/.test(v)) return t('enterValidEmail');
  return null;
}

function validateName(name: string, t: ReturnType<typeof useI18n>['t']): string | null {
  return name.trim().length > 1 ? null : t('nameIsRequired');
}

export default function DriverRegistrationScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nameError = useMemo(() => validateName(name, t), [name, t]);
  const emailError = useMemo(() => validateEmail(email, t), [email, t]);
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
      setSuccessMessage(payload.message || t('applicationSubmitted'));
    } catch (e: any) {
      setError(e?.message ?? t('unableToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      subtitle={t('driverApplication')}
      title={t('applyToDrive')}
      description={t('registerDescription')}
    >
      <View style={styles.notice}>
        <StatusBadge label={t('adminVerificationRequired')} tone="warning" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.noticeText}>
          {t('applicationNotice')}
        </ThemedText>
      </View>

      <TextField
        label={`${t('fullName')} *`}
        placeholder={t('fullName')}
        value={name}
        onChangeText={setName}
        editable={!submitting}
        autoCapitalize="words"
        returnKeyType="next"
        error={name ? nameError : null}
      />

      <TextField
        label={`${t('email')} *`}
        placeholder="email@example.com"
        value={email}
        onChangeText={setEmail}
        editable={!submitting}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        error={email ? emailError : null}
      />

      <TextField
        label={t('phoneNumber')}
        placeholder="+2519..."
        value={phone_number}
        onChangeText={setPhoneNumber}
        editable={!submitting}
        keyboardType="phone-pad"
        returnKeyType="next"
        helperText={t('optionalRecommended')}
      />

      <TextField
        label={t('username')}
        placeholder="@username"
        value={username}
        onChangeText={setUsername}
        editable={!submitting}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        helperText={t('usernameOptional')}
      />

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {successMessage ? (
        <ThemedText style={[styles.success, { color: theme.tint }]}>{successMessage}</ThemedText>
      ) : null}

      <Button
        disabled={!canSubmit}
        onPress={() => void handleSubmit()}
        label={submitting ? t('submitting') : t('submitApplication')}
      />
      {submitting ? <ActivityIndicator /> : null}

      <Pressable disabled={submitting} onPress={() => router.push('/(auth)/login' as any)}>
        <ThemedText type="linkPrimary" style={styles.link}>
          {t('alreadyHaveAccount')}
        </ThemedText>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  noticeText: { flex: 1 },
  error: { color: '#c62828' },
  success: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
  link: { textAlign: 'center' },
});

