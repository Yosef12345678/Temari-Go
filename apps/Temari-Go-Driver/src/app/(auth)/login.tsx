import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/hooks/use-i18n';
import { useSession } from '@/state/session-context';

export default function LoginScreen() {
  const { t } = useI18n();
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
      setError(e?.message ?? t('unableToSignIn'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenShell
      subtitle={t('driverPortal')}
      title={t('signIn')}
    >
      <View style={styles.notice}>
        <StatusBadge label={t('driverOnly')} tone="info" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.noticeText}>
          {t('signInNotice')}
        </ThemedText>
      </View>

      <TextField
        label={t('emailOrUsername')}
        placeholder={t('emailOrUsername')}
        autoCapitalize="none"
        autoCorrect={false}
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
        editable={!loading}
        returnKeyType="next"
      />

      <TextField
        label={t('password')}
        placeholder={t('password')}
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
        rightAccessory={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={10}
          >
            {showPassword ? <EyeOff size={18} color={theme.icon} /> : <Eye size={18} color={theme.icon} />}
          </Pressable>
        }
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <Button
        disabled={!canSubmit}
        onPress={onSubmit}
        label={loading ? t('signingIn') : t('signIn')}
      />
      {loading ? <ActivityIndicator /> : null}

      <Pressable disabled={loading} onPress={() => router.push('/(auth)/register' as any)}>
        <ThemedText type="linkPrimary" style={styles.link}>
          {t('newDriverApply')}
        </ThemedText>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  noticeText: { flex: 1 },
  error: { color: '#c62828' },
  link: { textAlign: 'center' },
});
