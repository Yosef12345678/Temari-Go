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
    <View className="bg-background flex-1 justify-center px-4">
      <AppBrand subtitle="Parent Registration" />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Sign up and set the details required to continue.</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="gap-2">
            <Label>Name *</Label>
            <Input value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" />
            {nameError ? <Text className="text-destructive text-sm">{nameError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>Email *</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            {emailError ? <Text className="text-destructive text-sm">{emailError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>Password *</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
            />
            {passwordError ? <Text className="text-destructive text-sm">{passwordError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>Phone number *</Label>
            <Input
              value={phone_number}
              onChangeText={setPhoneNumber}
              placeholder="+2519..."
              keyboardType="phone-pad"
            />
            {phoneError ? <Text className="text-destructive text-sm">{phoneError}</Text> : null}
          </View>

          <View className="gap-2">
            <Label>Language preference *</Label>
            <Input
              value={language_preference}
              onChangeText={setLanguagePreference}
              placeholder="e.g. en"
              autoCapitalize="none"
            />
            {langError ? <Text className="text-destructive text-sm">{langError}</Text> : null}
          </View>

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button
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
            }}>
            <Text>{submitting ? 'Creating account...' : 'Create account'}</Text>
          </Button>

          <Button variant="link" onPress={() => router.push('/(auth)/login' as any)}>
            <Text>Already have an account? Sign in</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}

