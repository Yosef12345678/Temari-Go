import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import * as authApi from '@/src/api/auth';

function validateIdentifier(value: string) {
  if (!value.trim()) return 'Email or username is required.';
  return null;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const identifierError = useMemo(() => validateIdentifier(identifier), [identifier]);
  const canSubmit = !identifierError && !submitting;

  return (
    <AuthScreenShell
      subtitle="Password Recovery"
      title="Forgot password"
      description="Enter your email or username and we will send a reset code.">
      {!sent ? (
        <>
          <Label>Email or Username</Label>
          <Input
            value={identifier}
            onChangeText={setIdentifier}
            editable={!submitting}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="email@example.com"
            returnKeyType="send"
            onSubmitEditing={async () => {
              if (!canSubmit) return;
              setSubmitting(true);
              setError(null);
              try {
                await authApi.forgotPassword({ emailOrUsername: identifier.trim() });
                setSent(true);
              } catch (e: any) {
                setError(e?.message ?? 'Unable to send reset code. Please try again.');
              } finally {
                setSubmitting(false);
              }
            }}
          />
          {identifierError ? <Text className="text-destructive text-sm">{identifierError}</Text> : null}
          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          <Button
            disabled={!canSubmit}
            onPress={async () => {
              setSubmitting(true);
              setError(null);
              try {
                await authApi.forgotPassword({ emailOrUsername: identifier.trim() });
                setSent(true);
              } catch (e: any) {
                setError(e?.message ?? 'Unable to send reset code. Please try again.');
              } finally {
                setSubmitting(false);
              }
            }}>
            <Text>{submitting ? 'Sending code...' : 'Send reset code'}</Text>
          </Button>
        </>
      ) : (
        <>
          <Text className="text-sm">
            If an account exists for <Text className="font-semibold">{identifier.trim()}</Text>, a reset code has been sent.
          </Text>
          <Button onPress={() => router.push('/(auth)/reset-password' as any)}>
            <Text>Continue to reset password</Text>
          </Button>
          <Button variant="link" onPress={() => router.push('/(auth)/login' as any)}>
            <Text>Back to sign in</Text>
          </Button>
        </>
      )}
    </AuthScreenShell>
  );
}

