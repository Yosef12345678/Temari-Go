import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/src/hooks/useAuth';
import { useMe, useUpdateMe } from '@/src/hooks/useMe';
import { getMissingParentFields } from '@/src/utils/profileCompletion';
import { validateLanguagePreference, validatePhone } from '@/src/utils/validators';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ProfileCompletionScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const meQuery = useMe();
  const updateMe = useUpdateMe();
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');

  const me = meQuery.data;
  const [name, setName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [language_preference, setLanguagePreference] = useState('');

  useEffect(() => {
    if (!me) return;
    setName((me.name as string) ?? '');
    setPhoneNumber((me.phone_number as string) ?? '');
    setLanguagePreference((me.language_preference as string) ?? '');
  }, [me]);

  const missing = useMemo(() => getMissingParentFields(me), [me]);
  const phoneError = useMemo(() => validatePhone(phone_number), [phone_number]);
  const langError = useMemo(() => validateLanguagePreference(language_preference), [language_preference]);
  const nameError = useMemo(() => (name.trim() ? null : 'Name is required.'), [name]);

  const canSave = !nameError && !phoneError && !langError && !updateMe.isPending;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Update your details</ThemedText>
      <ThemedText>
        Optional: add the details below{missing.length ? ` (${missing.join(', ')})` : '.'}
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Name</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
        />
        {nameError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{nameError}</ThemedText> : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Phone number</ThemedText>
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
        <ThemedText type="defaultSemiBold">Language preference</ThemedText>
        <TextInput
          value={language_preference}
          onChangeText={setLanguagePreference}
          placeholder="e.g. en"
          autoCapitalize="none"
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
        />
        {langError ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{langError}</ThemedText> : null}
      </View>

      {updateMe.error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {(updateMe.error as any)?.message ?? 'Update failed'}
        </ThemedText>
      ) : null}

      <Pressable
        disabled={!canSave}
        onPress={async () => {
          try {
            await updateMe.mutateAsync({
              name: name.trim(),
              phone_number: phone_number.trim(),
              language_preference: language_preference.trim(),
            });
            router.replace('/(tabs)/children' as any);
          } catch {
            // error is rendered below
          }
        }}
        style={[styles.button, { backgroundColor: tint }, !canSave && styles.buttonDisabled]}>
        <ThemedText type="defaultSemiBold">{updateMe.isPending ? 'Saving…' : 'Save'}</ThemedText>
      </Pressable>

      <Pressable onPress={() => router.replace('/(tabs)/children' as any)} style={[styles.secondaryButton, { borderColor }]}>
        <ThemedText type="defaultSemiBold" style={{ color: tint }}>
          Continue to home
        </ThemedText>
      </Pressable>

      <Pressable onPress={() => void logout()} style={styles.linkButton}>
        <ThemedText type="link">Log out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 14, justifyContent: 'center' },
  field: { gap: 8 },
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
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonDisabled: { opacity: 0.5 },
  linkButton: { alignItems: 'center', paddingVertical: 10 },
  errorText: { fontSize: 14 },
});

