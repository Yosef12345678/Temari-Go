import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CircleDollarSign, Mail, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitPay } from '@/src/hooks/useBilling';
import { useMe } from '@/src/hooks/useMe';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ invoiceId?: string; amount?: string; studentId?: string; dueDate?: string }>();
  const me = useMe();
  const initPay = useInitPay();
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');

  const invoiceId = String(params.invoiceId ?? '').trim();
  const presetAmount = String(params.amount ?? '').trim();
  const presetStudentId = String(params.studentId ?? '').trim();

  const [amount, setAmount] = useState(presetAmount);
  const [email, setEmail] = useState(String(me.data?.email ?? ''));
  const [full_name, setFullName] = useState(String((me.data as any)?.name ?? ''));

  const canSubmit =
    Boolean(me.data?.id) &&
    invoiceId.length > 0 &&
    email.trim().length > 3 &&
    full_name.trim().length > 0 &&
    !initPay.isPending;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">{t('payScreen.title')}</ThemedText>
        <ThemedText>{t('payScreen.subtitle')}</ThemedText>

        <Card style={[styles.formCard, { borderColor }]}>
          <CardHeader>
            <CardTitle>{t('payScreen.details')}</CardTitle>
          </CardHeader>
          <CardContent style={styles.formBody}>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">{t('payScreen.invoiceId')}</ThemedText>
              <TextInput
                value={invoiceId}
                editable={false}
                selectTextOnFocus={false}
                style={[styles.input, { borderColor, backgroundColor: inputBackground }]}
                placeholder={t('payScreen.invoiceIdPlaceholder')}
              />
            </View>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">{t('payScreen.amount')}</ThemedText>
              <View style={[styles.inputWithIcon, { borderColor, backgroundColor: inputBackground }]}>
                <CircleDollarSign color={iconColor} size={16} />
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  editable={false}
                  selectTextOnFocus={false}
                  style={styles.inputInner}
                  placeholder={t('payScreen.amount')}
                  keyboardType="numeric"
                />
              </View>
              {presetStudentId ? (
                <ThemedText style={styles.helperText}>{t('payScreen.studentLabel', { id: presetStudentId })}</ThemedText>
              ) : null}
            </View>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">{t('payScreen.email')}</ThemedText>
              <View style={[styles.inputWithIcon, { borderColor, backgroundColor: inputBackground }]}>
                <Mail color={iconColor} size={16} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.inputInner}
                  placeholder={t('payScreen.emailPlaceholder')}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">{t('payScreen.fullName')}</ThemedText>
              <View style={[styles.inputWithIcon, { borderColor, backgroundColor: inputBackground }]}>
                <UserRound color={iconColor} size={16} />
                <TextInput value={full_name} onChangeText={setFullName} style={styles.inputInner} placeholder={t('payScreen.fullNamePlaceholder')} />
              </View>
            </View>
          </CardContent>
        </Card>

        {initPay.error ? (
          <ThemedText style={[styles.errorText, { color: errorColor }]}>
            {(initPay.error as any)?.message ?? t('payScreen.initFailed')}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={async () => {
            const res = await initPay.mutateAsync({
              invoice_id: invoiceId,
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
            <ThemedText type="defaultSemiBold">{initPay.isPending ? t('payScreen.starting') : t('payScreen.continueCheckout')}</ThemedText>
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
  helperText: { opacity: 0.78, fontSize: 13 },
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

