import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, Clock3, CreditCard, ReceiptText, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { RestrictedTabContent } from '@/components/access/restricted-tab-content';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const successColor = useThemeColor({ light: '#16a34a', dark: '#4ade80' }, 'tint');
  const warningColor = useThemeColor({ light: '#ca8a04', dark: '#facc15' }, 'tint');
  const failColor = useThemeColor({ light: '#dc2626', dark: '#f87171' }, 'tint');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const heroBackground = useThemeColor({ light: '#eef4ff', dark: '#0f1d34' }, 'background');
  const isRefreshing = invoices.isRefetching || payments.isRefetching;

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
      <View style={[styles.headerCard, { borderColor, backgroundColor: heroBackground }]}>
        <View style={styles.headerText}>
          <ThemedText type="title">{t('billingTab.title')}</ThemedText>
          <ThemedText style={{ color: mutedText }}>{t('billingTab.subtitle')}</ThemedText>
        </View>
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
        {params.paymentStatus ? (
          <Card style={[styles.feedbackCard, { borderColor }]}>
            <CardContent style={styles.feedbackBody}>
              <ThemedText type="defaultSemiBold">{getPaymentFeedbackTitle(String(params.paymentStatus), t)}</ThemedText>
              <ThemedText>{getPaymentFeedbackMessage(String(params.paymentStatus), t)}</ThemedText>
            </CardContent>
          </Card>
        ) : null}
        <Card style={[styles.summaryCard, { borderColor }]}>
          <CardContent style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <ReceiptText color={iconColor} size={18} />
              <ThemedText type="defaultSemiBold">{String(invoices.data?.data?.length ?? 0)}</ThemedText>
              <ThemedText>{t('billingTab.invoices')}</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <CreditCard color={iconColor} size={18} />
              <ThemedText type="defaultSemiBold">{String(payments.data?.data?.length ?? 0)}</ThemedText>
              <ThemedText>{t('billingTab.payments')}</ThemedText>
            </View>
          </CardContent>
        </Card>

        <View style={styles.section}>
          <ThemedText type="subtitle">{t('billingTab.invoices')}</ThemedText>
          {invoices.isLoading ? <ThemedText>{t('billingTab.loadingInvoices')}</ThemedText> : null}
          {invoices.error ? (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {(invoices.error as any)?.message ?? t('billingTab.failedInvoices')}
            </ThemedText>
          ) : null}

          {(invoices.data?.data ?? []).map((item: any) => (
            <Card key={String(item.id)} style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle>{t('billingTab.invoiceNumber', { id: String(item.id) })}</CardTitle>
                <StatusBadge
                  status={String(item.status ?? '')}
                  successColor={successColor}
                  warningColor={warningColor}
                  failColor={failColor}
                />
              </CardHeader>
              <CardContent style={styles.cardBody}>
                <View style={styles.row}>
                  <ThemedText>{t('billingTab.amount')}</ThemedText>
                  <ThemedText type="defaultSemiBold">{String(item.amount ?? '-')}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText>{t('billingTab.dueDate')}</ThemedText>
                  <View style={styles.metaInline}>
                    <Clock3 color={iconColor} size={14} />
                    <ThemedText>{formatDate(item.dueDate)}</ThemedText>
                  </View>
                </View>
                {isInvoicePayable(item) ? (
                  <Pressable
                    accessibilityRole="button"
                    style={[styles.invoicePayButton, { backgroundColor: tint }]}
                    onPress={() =>
                      router.push({
                        pathname: '/billing/pay' as any,
                        params: {
                          invoiceId: String(item.id),
                          amount: String(item.amount ?? ''),
                          studentId: String(item.studentId ?? ''),
                          dueDate: String(item.dueDate ?? ''),
                        },
                      } as any)
                    }>
                    <View style={styles.buttonInner}>
                      <ThemedText type="defaultSemiBold">{t('billingTab.payInvoice')}</ThemedText>
                      <ArrowRight color="#111827" size={16} />
                    </View>
                  </Pressable>
                ) : null}
              </CardContent>
            </Card>
          ))}
          {!invoices.isLoading && (invoices.data?.data?.length ?? 0) === 0 ? (
            <EmptyStateCard
               title={t('billingTab.emptyInvoicesTitle')}
              subtitle={t('billingTab.emptyInvoicesSubtitle')}
              image={require('@/assets/images/illustrations/empty-billing.svg')}
              borderColor={borderColor}
              backgroundColor={cardBackground}
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

          {(payments.data?.data ?? []).map((item: any) => (
            <Card key={String(item.id)} style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle>{t('billingTab.paymentNumber', { id: String(item.id) })}</CardTitle>
                <StatusBadge
                  status={String(item.status ?? '')}
                  successColor={successColor}
                  warningColor={warningColor}
                  failColor={failColor}
                />
              </CardHeader>
              <CardContent style={styles.cardBody}>
                <View style={styles.row}>
                  <ThemedText>{t('billingTab.amount')}</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {String(item.amount ?? '-')} {String(item.currency ?? '')}
                  </ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText>{t('billingTab.date')}</ThemedText>
                  <ThemedText>{formatDate(item.createdAt)}</ThemedText>
                </View>
                {item.tx_ref ? (
                  <View style={styles.row}>
                    <ThemedText>{t('billingTab.txRef')}</ThemedText>
                    <ThemedText>{String(item.tx_ref)}</ThemedText>
                  </View>
                ) : null}
              </CardContent>
            </Card>
          ))}
          {!payments.isLoading && (payments.data?.data?.length ?? 0) === 0 ? (
            <EmptyStateCard
              title={t('billingTab.emptyPaymentsTitle')}
              subtitle={t('billingTab.emptyPaymentsSubtitle')}
              image={require('@/assets/images/illustrations/empty-billing.svg')}
              borderColor={borderColor}
              backgroundColor={cardBackground}
            />
          ) : null}
        </View>
      </ScrollView>
      </RestrictedTabContent>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerText: { flex: 1, gap: 2 },
  scrollBody: { gap: 14, paddingBottom: 24 },
  summaryCard: { borderWidth: 1 },
  feedbackCard: { borderWidth: 1 },
  feedbackBody: { gap: 4 },
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
  invoicePayButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyCard: { borderWidth: 1, borderRadius: 14 },
  emptyBody: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyImage: { width: 180, height: 110 },
  emptyText: { opacity: 0.78, textAlign: 'center' },
  errorText: { fontSize: 14 },
});

function StatusBadge({ status, successColor, warningColor, failColor }: { status: string; successColor: string; warningColor: string; failColor: string }) {
  const normalized = status.trim().toLowerCase();
  const variant = normalized === 'completed' || normalized === 'paid' ? 'default' : normalized === 'pending' ? 'secondary' : 'outline';
  const icon =
    normalized === 'completed' || normalized === 'paid' ? (
      <CheckCircle2 size={14} color={successColor} />
    ) : normalized === 'pending' ? (
      <Clock3 size={14} color={warningColor} />
    ) : (
      <XCircle size={14} color={failColor} />
    );
  return (
    <Badge variant={variant as any}>
      <View style={styles.badgeInner}>
        {icon}
        <ThemedText>{status || 'Unknown'}</ThemedText>
      </View>
    </Badge>
  );
}

function EmptyStateCard({
  title,
  subtitle,
  image,
  borderColor,
  backgroundColor,
}: {
  title: string;
  subtitle: string;
  image: number;
  borderColor: string;
  backgroundColor: string;
}) {
  return (
    <Card style={[styles.emptyCard, { borderColor, backgroundColor }]}>
      <CardContent style={styles.emptyBody}>
        <Image source={image} style={styles.emptyImage} contentFit="contain" />
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={styles.emptyText}>{subtitle}</ThemedText>
      </CardContent>
    </Card>
  );
}

function formatDate(value: unknown) {
  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) return String(value ?? '-');
  return date.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

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

function isInvoicePayable(invoice: any): boolean {
  const status = String(invoice?.status ?? '').trim().toLowerCase();
  return status === 'pending' || status === 'overdue';
}

