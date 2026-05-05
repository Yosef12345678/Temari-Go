import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppBrand } from '@/components/app-brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => emailOrUsername.trim().length > 0 && password.length >= 1 && !submitting,
    [emailOrUsername, password, submitting]
  );

  return (
    <View className="bg-background flex-1 justify-center px-4">
      <AppBrand subtitle="Parent Login" />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email or username to continue.</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="gap-2">
            <Label>Email or Username</Label>
            <Input
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="email@example.com"
            />
          </View>

          <View className="gap-2">
            <Label>Password</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
          </View>

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button
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
            }}>
            <Text>{submitting ? 'Signing in...' : 'Sign in'}</Text>
          </Button>

          <Button variant="link" onPress={() => router.push('/(auth)/register' as any)}>
            <Text>New here? Create an account</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}

