import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Mail, Phone, UserRound } from 'lucide-react-native';

import { AppBrand } from '@/components/app-brand';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { ScreenShell } from '@/components/ui/screen-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing } from '@/constants/theme';
import { useDriverProfile } from '@/hooks/use-driver-profile';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences, type LanguagePreference, type ThemePreference } from '@/state/preferences-context';
import { useSession } from '@/state/session-context';

const THEME_OPTIONS: { value: ThemePreference; labelKey: 'system' | 'light' | 'dark' }[] = [
  { value: 'system', labelKey: 'system' },
  { value: 'light', labelKey: 'light' },
  { value: 'dark', labelKey: 'dark' },
];

const LANGUAGE_OPTIONS: { value: LanguagePreference; labelKey: 'english' | 'amharic' }[] = [
  { value: 'en', labelKey: 'english' },
  { value: 'am', labelKey: 'amharic' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const { signOut } = useSession();
  const { profile, loading, error, load } = useDriverProfile();
  const { themePreference, language, setThemePreference, setLanguage } = usePreferences();

  return (
    <ScreenShell title={t('profile')} subtitle={t('profileSubtitle')}>
      {loading ? <LoadingState message={t('loadingProfile')} /> : null}
      {!loading && error ? <ErrorState title={t('profileUnavailable')} message={error} onRetry={load} /> : null}
      {!loading && !error && !profile ? <EmptyState title={t('profileUnavailable')} /> : null}
      {!loading && !error && profile ? (
        <>
          <Card style={styles.heroCard}>
            <AppBrand compact subtitle={t('signedInAs')} />
            <View style={styles.identityRow}>
              <View style={[styles.avatar, { backgroundColor: `${theme.tint}18` }]}> 
                <UserRound size={28} color={theme.tint} />
              </View>
              <View style={styles.identityCopy}>
                <ThemedText type="subtitle" style={styles.name}>{valueOrFallback(profile.name, t('notProvided'))}</ThemedText>
                <StatusBadge label={String(profile.role ?? 'driver')} tone="info" />
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>{t('accountInfo')}</ThemedText>
            <InfoRow icon={<Mail size={18} color={theme.icon} />} label={t('email')} value={profile.email} fallback={t('notProvided')} />
            <InfoRow icon={<UserRound size={18} color={theme.icon} />} label={t('username')} value={profile.username} fallback={t('notProvided')} />
            <InfoRow icon={<Phone size={18} color={theme.icon} />} label={t('phone')} value={profile.phone_number} fallback={t('notProvided')} />
            <InfoRow label={t('role')} value={profile.role} fallback={t('notProvided')} />
          </Card>

          <Card style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>{t('appPreferences')}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('chooseTheme')}</ThemedText>
            <View style={styles.chipRow}>
              {THEME_OPTIONS.map((item) => (
                <FilterChip
                  key={item.value}
                  label={t(item.labelKey)}
                  selected={themePreference === item.value}
                  onPress={() => void setThemePreference(item.value)}
                />
              ))}
            </View>
            <ThemedText themeColor="textSecondary">{t('chooseLanguage')}</ThemedText>
            <View style={styles.chipRow}>
              {LANGUAGE_OPTIONS.map((item) => (
                <FilterChip
                  key={item.value}
                  label={t(item.labelKey)}
                  selected={language === item.value}
                  onPress={() => void setLanguage(item.value)}
                />
              ))}
            </View>
          </Card>

          <Button label={t('logout')} variant="outline" onPress={signOut} />
        </>
      ) : null}
    </ScreenShell>
  );
}

function InfoRow({ icon, label, value, fallback }: { icon?: React.ReactNode; label: string; value?: unknown; fallback: string }) {
  return (
    <View style={styles.infoRow}>
      {icon ? <View style={styles.infoIcon}>{icon}</View> : null}
      <View style={styles.infoCopy}>
        <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
        <ThemedText>{valueOrFallback(value, fallback)}</ThemedText>
      </View>
    </View>
  );
}

function valueOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

const styles = StyleSheet.create({
  heroCard: {
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: 24,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
  },
  card: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 17,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoIcon: {
    width: 34,
    alignItems: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
