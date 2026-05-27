import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { RestrictedTabContent } from '@/components/access/restricted-tab-content';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BillingEmptyState,
  BillingHeader,
  BillingSummary,
  InvoiceCard,
  PaymentCard,
  PaymentFeedback,
  isInvoicePayable,
  resolveInvoiceDueDate,
  type BillingTheme,
} from '@/components/guardian/billing-tab-components';
import { useInvoices, usePaymentsByParent } from '@/src/hooks/useBilling';
import { useParentAccess } from '@/src/hooks/useParentAccess';
import { useMe } from '@/src/hooks/useMe';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function BillingTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ paymentStatus?: string }>();
  const access = useParentAccess();
  const me = useMe();
  const invoices = useInvoices({ limit: 50, offset: 0 });
  const payments = usePaymentsByParent(me.data?.id ?? '', { limit: 20, offset: 0 });

  // Clear payment status after 5 seconds
  useEffect(() => {
    if (params.paymentStatus) {
      const timer = setTimeout(() => {
        router.setParams({ paymentStatus: undefined } as any);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [params.paymentStatus, router]);
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const successColor = useThemeColor({ light: '#16a34a', dark: '#4ade80' }, 'tint');
  const warningColor = useThemeColor({ light: '#ca8a04', dark: '#facc15' }, 'tint');
  const failColor = useThemeColor({ light: '#dc2626', dark: '#f87171' }, 'tint');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const billingTheme: BillingTheme = {
    borderColor,
    cardBackground,
    tint,
    iconColor,
    successColor,
    warningColor,
    failColor,
    mutedText,
  };
  const isRefreshing = invoices.isRefetching || payments.isRefetching;
  const invoiceItems = invoices.data?.data ?? [];
  const paymentItems = payments.data?.data ?? [];
  // Sort invoices by due date (oldest first) to match backend payment logic
  const sortedInvoices = [...invoiceItems].sort((a: any, b: any) => {
    const dateA = new Date(resolveInvoiceDueDate(a) || 0);
    const dateB = new Date(resolveInvoiceDueDate(b) || 0);
    return dateA.getTime() - dateB.getTime();
  });
  const dueInvoices = sortedInvoices.filter((item: any) => isInvoicePayable(item));
  const paidInvoices = sortedInvoices.filter((item: any) => String(item.status ?? '').trim().toLowerCase() === 'paid');
  // Find the oldest payable invoice (will be paid first)
  const oldestPayableInvoiceId = dueInvoices.length > 0 ? dueInvoices[0].id : null;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <RestrictedTabContent
        resolving={access.isResolving}
        restricted={access.isRestricted}
        title={t('billingTab.restrictedTitle')}
        subtitle={t('billingTab.restrictedSubtitle')}
        onRetry={() => {
          void access.refetch();
        }}>
      <BillingHeader theme={billingTheme} title={t('billingTab.title')} subtitle={t('billingTab.subtitle')} />

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
        {params.paymentStatus ? (
          <PaymentFeedback
            theme={billingTheme}
            title={getPaymentFeedbackTitle(String(params.paymentStatus), t)}
            message={getPaymentFeedbackMessage(String(params.paymentStatus), t)}
          />
        ) : null}
        <BillingSummary
          theme={billingTheme}
          invoices={String(invoiceItems.length)}
          pending={String(dueInvoices.length)}
          payments={String(paymentItems.length || paidInvoices.length)}
          invoiceLabel={t('billingTab.invoices')}
          pendingLabel={t('billingTab.pending')}
          paymentLabel={t('billingTab.payments')}
        />

        <View style={styles.section}>
          <ThemedText type="subtitle">{t('billingTab.invoices')}</ThemedText>
          {invoices.isLoading ? <ThemedText>{t('billingTab.loadingInvoices')}</ThemedText> : null}
          {invoices.error ? (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {(invoices.error as any)?.message ?? t('billingTab.failedInvoices')}
            </ThemedText>
          ) : null}

          {sortedInvoices.map((item: any) => (
            <InvoiceCard
              key={String(item.id)}
              item={item}
              theme={billingTheme}
              t={t}
              isOldestPayable={String(item.id) === String(oldestPayableInvoiceId)}
              onPay={() =>
                router.push({
                  pathname: '/billing/pay' as any,
                  params: {
                    invoiceId: String(item.id),
                    amount: String(item.amount ?? ''),
                    studentId: String(item.studentId ?? item.student_id ?? ''),
                    dueDate: String(resolveInvoiceDueDate(item) ?? ''),
                  },
                } as any)
              }
            />
          ))}
          {!invoices.isLoading && invoiceItems.length === 0 ? (
            <BillingEmptyState
              theme={billingTheme}
              title={t('billingTab.emptyInvoicesTitle')}
              subtitle={t('billingTab.emptyInvoicesSubtitle')}
              image={require('@/assets/images/illustrations/empty-billing.svg')}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">{t('billingTab.paymentHistory')}</ThemedText>
          {payments.isLoading ? <ThemedText>{t('billingTab.loadingPayments')}</ThemedText> : null}
          {payments.error ? (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {(payments.error as any)?.message ?? t('billingTab.failedPayments')}
            </ThemedText>
          ) : null}

          {paymentItems.map((item: any) => (
            <PaymentCard key={String(item.id)} item={item} theme={billingTheme} t={t} />
          ))}
          {!payments.isLoading && paymentItems.length === 0 ? (
            <BillingEmptyState
              theme={billingTheme}
              title={t('billingTab.emptyPaymentsTitle')}
              subtitle={t('billingTab.emptyPaymentsSubtitle')}
              image={require('@/assets/images/illustrations/empty-billing.svg')}
            />
          ) : null}
        </View>
      </ScrollView>
      </RestrictedTabContent>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, gap: 8 },
  scrollBody: { gap: 10, paddingBottom: 20 },
  section: { gap: 8 },
  errorText: { fontSize: 14 },
});

function getPaymentFeedbackTitle(status: string, t: (k: string) => string) {
  if (status === 'success') return t('billingTab.feedbackTitleSuccess');
  if (status === 'cancelled') return t('billingTab.feedbackTitleCancelled');
  return t('billingTab.feedbackTitleFailed');
}

function getPaymentFeedbackMessage(status: string, t: (k: string) => string) {
  if (status === 'success') return t('billingTab.feedbackSuccess');
  if (status === 'cancelled') return t('billingTab.feedbackCancelled');
  return t('billingTab.feedbackFailed');
}

