import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Clock3, CreditCard, ReceiptText } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices, usePaymentsByParent } from '@/src/hooks/useBilling';
import { useMe } from '@/src/hooks/useMe';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function BillingTab() {
  const router = useRouter();
  const me = useMe();
  const invoices = useInvoices({ limit: 50, offset: 0 });
  const payments = usePaymentsByParent(me.data?.id ?? '', { limit: 20, offset: 0 });
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const isRefreshing = invoices.isRefetching || payments.isRefetching;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Billing</ThemedText>
        <Pressable
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: tint }]}
          onPress={() => router.push('/billing/pay' as any)}>
          <View style={styles.buttonInner}>
            <ThemedText type="defaultSemiBold">Pay Now</ThemedText>
            <ArrowRight color="#111827" size={16} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void invoices.refetch();
              if (me.data?.id) void payments.refetch();
            }}
          />
        }>
        <Card style={[styles.summaryCard, { borderColor }]}>
          <CardContent style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <ReceiptText color={iconColor} size={18} />
              <ThemedText type="defaultSemiBold">{String(invoices.data?.data?.length ?? 0)}</ThemedText>
              <ThemedText>Invoices</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <CreditCard color={iconColor} size={18} />
              <ThemedText type="defaultSemiBold">{String(payments.data?.data?.length ?? 0)}</ThemedText>
              <ThemedText>Payments</ThemedText>
            </View>
          </CardContent>
        </Card>

        <View style={styles.section}>
          <ThemedText type="subtitle">Invoices</ThemedText>
          {invoices.isLoading ? <ThemedText>Loading invoices…</ThemedText> : null}
          {invoices.error ? (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {(invoices.error as any)?.message ?? 'Failed to load invoices'}
            </ThemedText>
          ) : null}

          {(invoices.data?.data ?? []).map((item: any) => (
            <Card key={String(item.id)} style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle>Invoice #{String(item.id)}</CardTitle>
                <StatusBadge status={String(item.status ?? '')} />
              </CardHeader>
              <CardContent style={styles.cardBody}>
                <View style={styles.row}>
                  <ThemedText>Amount</ThemedText>
                  <ThemedText type="defaultSemiBold">{String(item.amount ?? '-')}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText>Due Date</ThemedText>
                  <View style={styles.metaInline}>
                    <Clock3 color={iconColor} size={14} />
                    <ThemedText>{formatDate(item.dueDate)}</ThemedText>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
          {!invoices.isLoading && (invoices.data?.data?.length ?? 0) === 0 ? <ThemedText>No invoices.</ThemedText> : null}
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Payment History</ThemedText>
          {payments.isLoading ? <ThemedText>Loading payments…</ThemedText> : null}
          {payments.error ? (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {(payments.error as any)?.message ?? 'Failed to load payments'}
            </ThemedText>
          ) : null}

          {(payments.data?.data ?? []).map((item: any) => (
            <Card key={String(item.id)} style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle>Payment #{String(item.id)}</CardTitle>
                <StatusBadge status={String(item.status ?? '')} />
              </CardHeader>
              <CardContent style={styles.cardBody}>
                <View style={styles.row}>
                  <ThemedText>Amount</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {String(item.amount ?? '-')} {String(item.currency ?? '')}
                  </ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText>Date</ThemedText>
                  <ThemedText>{formatDate(item.createdAt)}</ThemedText>
                </View>
                {item.tx_ref ? (
                  <View style={styles.row}>
                    <ThemedText>Transaction Ref</ThemedText>
                    <ThemedText>{String(item.tx_ref)}</ThemedText>
                  </View>
                ) : null}
              </CardContent>
            </Card>
          ))}
          {!payments.isLoading && (payments.data?.data?.length ?? 0) === 0 ? <ThemedText>No payments.</ThemedText> : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scrollBody: { gap: 14, paddingBottom: 24 },
  summaryCard: { borderWidth: 1 },
  summaryContent: { flexDirection: 'row', justifyContent: 'space-around', gap: 12 },
  summaryItem: { alignItems: 'center', gap: 4 },
  section: { gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardBody: {
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 14 },
});

function StatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const variant = normalized === 'completed' || normalized === 'paid' ? 'default' : normalized === 'pending' ? 'secondary' : 'outline';
  return (
    <Badge variant={variant as any}>
      <ThemedText>{status || 'Unknown'}</ThemedText>
    </Badge>
  );
}

function formatDate(value: unknown) {
  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) return String(value ?? '-');
  return date.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

