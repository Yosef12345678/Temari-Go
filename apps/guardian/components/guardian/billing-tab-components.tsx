import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight, CheckCircle2, Clock3, CreditCard, ReceiptText, WalletCards, XCircle } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type BillingTheme = {
  borderColor: string;
  cardBackground: string;
  tint: string;
  iconColor: string;
  successColor: string;
  warningColor: string;
  failColor: string;
  mutedText: string;
};

type Translation = (key: string, options?: any) => string;

type BillingHeaderProps = {
  theme: BillingTheme;
  title: string;
  subtitle: string;
};

export function BillingHeader({ theme, title, subtitle }: BillingHeaderProps) {
  return (
    <View style={[styles.headerCard, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <View style={[styles.headerIcon, { backgroundColor: theme.tint }]}>
        <WalletCards color="#ffffff" size={22} />
      </View>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.headerTitle}>{title}</ThemedText>
        <ThemedText style={{ color: theme.mutedText }}>{subtitle}</ThemedText>
      </View>
    </View>
  );
}

type BillingSummaryProps = {
  theme: BillingTheme;
  invoices: string;
  pending: string;
  payments: string;
  invoiceLabel: string;
  pendingLabel: string;
  paymentLabel: string;
};

export function BillingSummary({ theme, invoices, pending, payments, invoiceLabel, pendingLabel, paymentLabel }: BillingSummaryProps) {
  return (
    <Card style={[styles.summaryCard, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <CardContent style={styles.summaryContent}>
        <BillingMetric icon={<ReceiptText color={theme.iconColor} size={18} />} value={invoices} label={invoiceLabel} />
        <BillingMetric icon={<Clock3 color={theme.warningColor} size={18} />} value={pending} label={pendingLabel} />
        <BillingMetric icon={<CreditCard color={theme.successColor} size={18} />} value={payments} label={paymentLabel} />
      </CardContent>
    </Card>
  );
}

type PaymentFeedbackProps = {
  theme: BillingTheme;
  title: string;
  message: string;
};

export function PaymentFeedback({ theme, title, message }: PaymentFeedbackProps) {
  return (
    <Card style={[styles.feedbackCard, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <CardContent style={styles.feedbackBody}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText>{message}</ThemedText>
      </CardContent>
    </Card>
  );
}

type InvoiceCardProps = {
  item: any;
  theme: BillingTheme;
  t: Translation;
  onPay: () => void;
};

export function InvoiceCard({ item, theme, t, onPay }: InvoiceCardProps) {
  const dueDate = resolveInvoiceDueDate(item);
  return (
    <Card style={[styles.card, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <CardHeader style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <ReceiptText color={theme.iconColor} size={18} />
          <CardTitle>{t('billingTab.invoiceNumber', { id: String(item.id) })}</CardTitle>
        </View>
        <BillingStatusBadge status={String(item.status ?? '')} theme={theme} />
      </CardHeader>
      <CardContent style={styles.cardBody}>
        <InfoRow label={t('billingTab.amount')} value={String(item.amount ?? '-')} strong />
        <View style={styles.row}>
          <ThemedText>{t('billingTab.dueDate')}</ThemedText>
          <View style={styles.metaInline}>
            <Clock3 color={theme.iconColor} size={14} />
            <ThemedText>{formatBillingDate(dueDate)}</ThemedText>
          </View>
        </View>
        {isInvoicePayable(item) ? (
          <Pressable accessibilityRole="button" style={[styles.invoicePayButton, { backgroundColor: theme.tint }]} onPress={onPay}>
            <View style={styles.buttonInner}>
              <ThemedText type="defaultSemiBold" lightColor="#ffffff" darkColor="#020617">{t('billingTab.payInvoice')}</ThemedText>
              <ArrowRight color="#ffffff" size={16} />
            </View>
          </Pressable>
        ) : null}
      </CardContent>
    </Card>
  );
}

type PaymentCardProps = {
  item: any;
  theme: BillingTheme;
  t: Translation;
};

export function PaymentCard({ item, theme, t }: PaymentCardProps) {
  return (
    <Card style={[styles.card, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <CardHeader style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <CreditCard color={theme.iconColor} size={18} />
          <CardTitle>{t('billingTab.paymentNumber', { id: String(item.id) })}</CardTitle>
        </View>
        <BillingStatusBadge status={String(item.status ?? '')} theme={theme} />
      </CardHeader>
      <CardContent style={styles.cardBody}>
        <InfoRow label={t('billingTab.amount')} value={`${String(item.amount ?? '-')} ${String(item.currency ?? '')}`.trim()} strong />
        <InfoRow label={t('billingTab.date')} value={formatBillingDate(item.createdAt)} />
        {item.tx_ref ? <InfoRow label={t('billingTab.txRef')} value={String(item.tx_ref)} /> : null}
      </CardContent>
    </Card>
  );
}

type EmptyStateCardProps = {
  theme: BillingTheme;
  title: string;
  subtitle: string;
  image: number;
};

export function BillingEmptyState({ theme, title, subtitle, image }: EmptyStateCardProps) {
  return (
    <Card style={[styles.emptyCard, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
      <CardContent style={styles.emptyBody}>
        <Image source={image} style={styles.emptyImage} contentFit="contain" />
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={styles.emptyText}>{subtitle}</ThemedText>
      </CardContent>
    </Card>
  );
}

export function BillingMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      {icon}
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
    </View>
  );
}

export function BillingStatusBadge({ status, theme }: { status: string; theme: BillingTheme }) {
  const normalized = status.trim().toLowerCase();
  const isSuccess = normalized === 'completed' || normalized === 'paid';
  const isPending = normalized === 'pending';
  const variant = isSuccess ? 'default' : isPending ? 'secondary' : 'outline';
  const icon = isSuccess ? <CheckCircle2 size={14} color={theme.successColor} /> : isPending ? <Clock3 size={14} color={theme.warningColor} /> : <XCircle size={14} color={theme.failColor} />;
  const textColor = variant === 'default' ? '#ffffff' : undefined;

  return (
    <Badge variant={variant as any} style={variant === 'default' ? { backgroundColor: '#111827' } : undefined}>
      <View style={styles.badgeInner}>
        {icon}
        <ThemedText lightColor={textColor} darkColor={textColor} style={styles.badgeText}>{status || 'Unknown'}</ThemedText>
      </View>
    </Badge>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <ThemedText>{label}</ThemedText>
      <ThemedText type={strong ? 'defaultSemiBold' : 'default'}>{value}</ThemedText>
    </View>
  );
}

export function formatBillingDate(value: unknown) {
  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) return String(value ?? '-');
  return date.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

export function resolveInvoiceDueDate(invoice: any) {
  return invoice?.dueDate ?? invoice?.due_date ?? invoice?.dueAt ?? invoice?.due_at ?? invoice?.deadline ?? null;
}

export function isInvoicePayable(invoice: any): boolean {
  const status = String(invoice?.status ?? '').trim().toLowerCase();
  return status === 'pending' || status === 'overdue';
}

const styles = StyleSheet.create({
  headerCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  headerIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 3 },
  headerTitle: { fontSize: 28, lineHeight: 34 },
  summaryCard: { borderWidth: 1, borderRadius: 20, paddingVertical: 0 },
  feedbackCard: { borderWidth: 1, borderRadius: 16, paddingVertical: 0 },
  feedbackBody: { gap: 4, paddingVertical: 14 },
  summaryContent: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 14, paddingHorizontal: 12 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  metricLabel: { textAlign: 'center', fontSize: 14, lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardBody: { gap: 8, paddingTop: 2, paddingBottom: 16, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  invoicePayButton: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 13, lineHeight: 17 },
  emptyCard: { borderWidth: 1, borderRadius: 18, paddingVertical: 0 },
  emptyBody: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyImage: { width: 150, height: 92 },
  emptyText: { opacity: 0.78, textAlign: 'center' },
});
