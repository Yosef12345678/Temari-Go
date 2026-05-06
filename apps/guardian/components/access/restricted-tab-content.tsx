import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LockKeyhole, ShieldAlert } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/themed-text';
import { Card, CardContent } from '@/components/ui/card';
import { useResolvedColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

type RestrictedTabContentProps = {
  resolving?: boolean;
  restricted: boolean;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onRetry?: () => void;
};

export function RestrictedTabContent({
  resolving,
  restricted,
  title,
  subtitle,
  children,
  onRetry,
}: RestrictedTabContentProps) {
  if (resolving) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
        <ThemedText>Checking student access…</ThemedText>
      </View>
    );
  }

  if (!restricted) return <>{children}</>;

  return (
    <View style={styles.host}>
      <View style={styles.backgroundContent} pointerEvents="none">
        {children}
      </View>
      <BlurView
        pointerEvents="none"
        intensity={55}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.scrim} />
      <ProtectedTabOverlay title={title} subtitle={subtitle} onRetry={onRetry} />
    </View>
  );
}

function ProtectedTabOverlay({
  title,
  subtitle,
  onRetry,
}: {
  title: string;
  subtitle: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const theme = useResolvedColorScheme();
  const borderColor = useThemeColor({}, 'border');
  const icon = useThemeColor({}, 'icon');
  const cardBackground = theme === 'dark' ? '#0f172a' : '#ffffff';
  const titleColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const subtitleColor = theme === 'dark' ? '#cbd5e1' : '#334155';
  const badgeColor = theme === 'dark' ? '#93c5fd' : '#1d4ed8';
  const primaryButtonBackground = theme === 'dark' ? '#3b82f6' : '#2563eb';
  const primaryButtonText = '#ffffff';
  const secondaryButtonText = theme === 'dark' ? '#bfdbfe' : '#1d4ed8';

  return (
    <View style={styles.overlay}>
      <Card style={[styles.glassCard, { borderColor, backgroundColor: cardBackground }]}>
        <CardContent style={styles.cardBody}>
          <View style={[styles.headerBadge, { borderColor }]}>
            <ThemedText style={[styles.headerBadgeText, { color: badgeColor }]}>ACCESS RESTRICTED</ThemedText>
          </View>
          <View style={styles.iconRow}>
            <ShieldAlert color={icon} size={18} />
            <LockKeyhole color={icon} size={18} />
          </View>
          <ThemedText style={[styles.headerTitle, { color: titleColor }]}>{title}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/modals/helpdesk' as any)}
            style={[styles.primaryButton, { backgroundColor: primaryButtonBackground }]}>
            <ThemedText style={{ color: primaryButtonText, fontWeight: '700' }}>Contact Admin</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onRetry?.()}
            style={[styles.secondaryButton, { borderColor }]}>
            <ThemedText style={{ color: secondaryButtonText, fontWeight: '700' }}>Retry Check</ThemedText>
          </Pressable>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  backgroundContent: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.35)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  glassCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
  },
  cardBody: {
    gap: 10,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  headerBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.92,
    maxWidth: 320,
  },
  primaryButton: {
    marginTop: 2,
    minWidth: 180,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    minWidth: 180,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
