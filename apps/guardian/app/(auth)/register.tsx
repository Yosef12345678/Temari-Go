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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [language_preference, setLanguagePreference] = useState<'en' | 'am'>('en');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const iconColor = useThemeColor({}, 'icon');

  const nameError = useMemo(() => (name.trim() ? null : 'Name is required.'), [name]);
  const emailError = useMemo(() => validateEmail(email), [email]);
  const passwordError = useMemo(
    () => (password.length >= 6 ? null : 'Password must be at least 6 characters.'),
    [password]
  );
  const confirmPasswordError = useMemo(
    () => (confirmPassword === password ? null : 'Passwords do not match.'),
    [confirmPassword, password]
  );
  const phoneError = useMemo(() => validatePhone(phone_number), [phone_number]);
  const langError = useMemo(() => validateLanguagePreference(language_preference), [language_preference]);

  const canSubmit = useMemo(
    () =>
      !nameError &&
      !emailError &&
      !passwordError &&
      !confirmPasswordError &&
      !phoneError &&
      !langError &&
      password.length > 0 &&
      !submitting,
    [confirmPasswordError, emailError, langError, nameError, passwordError, password.length, phoneError, submitting]
  );
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone_number: phone_number.trim(),
        language_preference,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      subtitle="Parent Registration"
      title="Create account"
      description="Sign up and set the details required to continue.">
      <View className="gap-2">
        <Label>Name *</Label>
        <Input value={name} onChangeText={setName} editable={!submitting} placeholder="Full name" autoCapitalize="words" />
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
          editable={!submitting}
          returnKeyType="next"
        />
        {emailError ? <Text className="text-destructive text-sm">{emailError}</Text> : null}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Label>Password *</Label>
          <Pressable onPress={() => setShowPassword((prev) => !prev)} className="flex-row items-center gap-1">
            {showPassword ? <EyeOff color={iconColor} size={14} /> : <Eye color={iconColor} size={14} />}
            <Text className="text-sm">{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!submitting}
          returnKeyType="next"
        />
        {passwordError ? <Text className="text-destructive text-sm">{passwordError}</Text> : null}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Label>Confirm password *</Label>
          <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} className="flex-row items-center gap-1">
            {showConfirmPassword ? <EyeOff color={iconColor} size={14} /> : <Eye color={iconColor} size={14} />}
            <Text className="text-sm">{showConfirmPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Input
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          editable={!submitting}
          returnKeyType="next"
        />
        {confirmPasswordError ? <Text className="text-destructive text-sm">{confirmPasswordError}</Text> : null}
      </View>

      <View className="gap-2">
        <Label>Phone number *</Label>
        <Input
          value={phone_number}
          onChangeText={setPhoneNumber}
          placeholder="+2519..."
          keyboardType="phone-pad"
          editable={!submitting}
          returnKeyType="next"
        />
        <Text className="text-muted-foreground text-xs">Use international format, e.g. +2519XXXXXXXX.</Text>
        {phoneError ? <Text className="text-destructive text-sm">{phoneError}</Text> : null}
      </View>

      <View className="gap-2">
        <Label>Language preference *</Label>
        <View className="flex-row gap-2">
          <Button
            variant={language_preference === 'en' ? 'default' : 'outline'}
            size="sm"
            disabled={submitting}
            onPress={() => setLanguagePreference('en')}>
            <Text>English</Text>
          </Button>
          <Button
            variant={language_preference === 'am' ? 'default' : 'outline'}
            size="sm"
            disabled={submitting}
            onPress={() => setLanguagePreference('am')}>
            <Text>Amharic</Text>
          </Button>
        </View>
        {langError ? <Text className="text-destructive text-sm">{langError}</Text> : null}
      </View>

      {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

      <Button disabled={!canSubmit} onPress={() => void handleSubmit()}>
        <Text>{submitting ? 'Creating account...' : 'Create account'}</Text>
      </Button>

      <Button variant="link" disabled={submitting} onPress={() => router.push('/(auth)/login' as any)}>
        <Text>Already have an account? Sign in</Text>
      </Button>
    </AuthScreenShell>
  );
}

