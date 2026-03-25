import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useInitPay } from '@/src/hooks/useBilling';
import { useMe } from '@/src/hooks/useMe';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PayScreen() {
  const router = useRouter();
  const me = useMe();
  const initPay = useInitPay();
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');

  const [student_id, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [full_name, setFullName] = useState('');

  const amountNumber = useMemo(() => Number(amount), [amount]);
  const canSubmit =
    Boolean(me.data?.id) &&
    student_id.trim().length > 0 &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    email.trim().length > 3 &&
    full_name.trim().length > 0 &&
    !initPay.isPending;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Make a payment</ThemedText>
      <ThemedText>
        This calls <ThemedText type="defaultSemiBold">POST /payment/pay</ThemedText> and opens the Chapa checkout.
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Student ID</ThemedText>
        <TextInput
          value={student_id}
          onChangeText={setStudentId}
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
          placeholder="student id"
        />
      </View>
      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Amount</ThemedText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
          placeholder="100"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Email</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
          placeholder="payer email"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Full name</ThemedText>
        <TextInput
          value={full_name}
          onChangeText={setFullName}
          style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
          placeholder="payer name"
        />
      </View>

      {initPay.error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {(initPay.error as any)?.message ?? 'Payment initiation failed. Please try again.'}
        </ThemedText>
      ) : null}

      <Pressable
        disabled={!canSubmit}
        onPress={async () => {
          const res = await initPay.mutateAsync({
            parent_id: String(me.data?.id),
            student_id: student_id.trim(),
            amount: amountNumber,
            email: email.trim(),
            full_name: full_name.trim(),
          });
          router.push({
            pathname: '/modals/payment-webview',
            params: { url: res.checkout_url },
          });
        }}
        style={[styles.button, { backgroundColor: tint }, !canSubmit && styles.buttonDisabled]}>
        <ThemedText type="defaultSemiBold">{initPay.isPending ? 'Starting…' : 'Continue to checkout'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, justifyContent: 'center' },
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
  buttonDisabled: { opacity: 0.5 },
  errorText: { fontSize: 14 },
});

