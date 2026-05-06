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
import { useAuth } from '@/src/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const iconColor = useThemeColor({}, 'icon');

  const canSubmit = useMemo(
    () => emailOrUsername.trim().length > 0 && password.length >= 1 && !submitting,
    [emailOrUsername, password, submitting]
  );
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login({ emailOrUsername: emailOrUsername.trim(), password });
    } catch (e: any) {
      setError(e?.message ?? 'Login failed. Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      subtitle="Parent Login"
      title="Sign in"
      description="Use your email or username to continue.">
      <View className="gap-2">
        <Label>Email or Username</Label>
        <Input
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          editable={!submitting}
          returnKeyType="next"
          placeholder="email@example.com"
          accessibilityLabel="Email or username"
        />
      </View>

      <View className="gap-2">
        <Label>Password</Label>
        <View className="relative">
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!submitting}
            returnKeyType="go"
            onSubmitEditing={() => void handleSubmit()}
            placeholder="••••••••"
            accessibilityLabel="Password"
            className="pr-10"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2">
            {showPassword ? <EyeOff color={iconColor} size={16} /> : <Eye color={iconColor} size={16} />}
          </Pressable>
        </View>
      </View>

      {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

      <Button disabled={!canSubmit} onPress={() => void handleSubmit()}>
        <Text>{submitting ? 'Signing in...' : 'Sign in'}</Text>
      </Button>

      <Button variant="link" disabled={submitting} onPress={() => router.push('/(auth)/forgot-password' as any)}>
        <Text>Forgot password?</Text>
      </Button>

      <Button variant="link" disabled={submitting} onPress={() => router.push('/(auth)/register' as any)}>
        <Text>New here? Create an account</Text>
      </Button>
    </AuthScreenShell>
  );
}

