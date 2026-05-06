import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, CircleDollarSign, Mail, UserRound } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const iconColor = useThemeColor({}, 'icon');

  const [student_id, setStudentId] = useState(String((me.data as any)?.default_student_id ?? ''));
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState(String(me.data?.email ?? ''));
  const [full_name, setFullName] = useState(String((me.data as any)?.name ?? ''));

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
      <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">Make a Payment</ThemedText>
        <ThemedText>Secure checkout for invoices and transport fees.</ThemedText>

        <Card style={[styles.formCard, { borderColor }]}>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent style={styles.formBody}>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Student ID</ThemedText>
              <TextInput
                value={student_id}
                onChangeText={setStudentId}
                style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
                placeholder="Enter student id"
              />
            </View>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Amount</ThemedText>
              <View style={[styles.inputWithIcon, { borderColor, backgroundColor: inputBackground }]}>
                <CircleDollarSign color={iconColor} size={16} />
                <TextInput value={amount} onChangeText={setAmount} style={styles.inputInner} placeholder="100" keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Email</ThemedText>
              <View style={[styles.inputWithIcon, { borderColor, backgroundColor: inputBackground }]}>
                <Mail color={iconColor} size={16} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.inputInner}
                  placeholder="payer email"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Full Name</ThemedText>
              <View style={[styles.inputWithIcon, { borderColor, backgroundColor: inputBackground }]}>
                <UserRound color={iconColor} size={16} />
                <TextInput value={full_name} onChangeText={setFullName} style={styles.inputInner} placeholder="payer name" />
              </View>
            </View>
          </CardContent>
        </Card>

        {initPay.error ? (
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {(initPay.error as any)?.message ?? 'Payment initiation failed. Please try again.'}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
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
          <View style={styles.buttonInner}>
            <ThemedText type="defaultSemiBold">{initPay.isPending ? 'Starting…' : 'Continue to checkout'}</ThemedText>
            <ArrowRight color="#111827" size={16} />
          </View>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  scrollBody: { gap: 12, paddingBottom: 32 },
  formCard: { borderWidth: 1 },
  formBody: { gap: 12 },
  field: { gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputWithIcon: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 0,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonDisabled: { opacity: 0.5 },
  errorText: { fontSize: 14 },
});

