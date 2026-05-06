import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';

import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useThemeColor } from '@/hooks/use-theme-color';
import * as authApi from '@/src/api/auth';

function validateCode(value: string) {
  if (!value.trim()) return 'Reset code is required.';
  return null;
}

function validatePassword(value: string) {
  if (value.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const iconColor = useThemeColor({}, 'icon');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const codeError = useMemo(() => validateCode(code), [code]);
  const passwordError = useMemo(() => validatePassword(newPassword), [newPassword]);
  const confirmPasswordError = useMemo(
    () => (confirmPassword === newPassword ? null : 'Passwords do not match.'),
    [confirmPassword, newPassword]
  );
  const canSubmit = !codeError && !passwordError && !confirmPasswordError && !submitting;

  return (
    <AuthScreenShell subtitle="Password Recovery" title="Reset password" description="Enter the code and your new password.">
      {!done ? (
        <>
          <View className="gap-2">
            <Label>Reset Code</Label>
            <Input
              value={code}
              onChangeText={setCode}
              editable={!submitting}
              autoCapitalize="none"
              placeholder="Enter reset code"
              returnKeyType="next"
            />
            {codeError ? <Text className="text-destructive text-sm">{codeError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>New Password</Label>
            <View className="relative">
              <Input
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                editable={!submitting}
                autoCapitalize="none"
                placeholder="••••••••"
                returnKeyType="next"
                className="pr-10"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide new password' : 'Show new password'}
                onPress={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff color={iconColor} size={16} /> : <Eye color={iconColor} size={16} />}
              </Pressable>
            </View>
            {passwordError ? <Text className="text-destructive text-sm">{passwordError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>Confirm Password</Label>
            <View className="relative">
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!submitting}
                autoCapitalize="none"
                placeholder="••••••••"
                returnKeyType="done"
                className="pr-10"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showConfirmPassword ? <EyeOff color={iconColor} size={16} /> : <Eye color={iconColor} size={16} />}
              </Pressable>
            </View>
            {confirmPasswordError ? <Text className="text-destructive text-sm">{confirmPasswordError}</Text> : null}
          </View>

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button
            disabled={!canSubmit}
            onPress={async () => {
              setSubmitting(true);
              setError(null);
              try {
                await authApi.resetPassword({ code: code.trim(), newPassword });
                setDone(true);
              } catch (e: any) {
                setError(e?.message ?? 'Unable to reset password. Please verify your code.');
              } finally {
                setSubmitting(false);
              }
            }}>
            <Text>{submitting ? 'Resetting...' : 'Reset password'}</Text>
          </Button>
        </>
      ) : (
        <>
          <Text className="text-sm">Your password has been reset successfully.</Text>
          <Button onPress={() => router.replace('/(auth)/login' as any)}>
            <Text>Go to sign in</Text>
          </Button>
        </>
      )}
    </AuthScreenShell>
  );
}

