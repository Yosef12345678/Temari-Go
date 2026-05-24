import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Headphones, Mail, MessageCircle, Phone, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppBrand } from '@/components/app-brand';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { Input } from '@/components/ui/input';
import { ScreenShell } from '@/components/ui/screen-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useMe, useUpdateMe } from '@/src/hooks/useMe';
import { i18n, setAppLanguage } from '@/src/i18n';
import { usePreferences, type ThemePreference, type LanguagePreference } from '@/src/state/preferences-context';

const THEME_OPTIONS: { value: ThemePreference; labelKey: 'profileTab.system' | 'profileTab.light' | 'profileTab.dark' }[] = [
  { value: 'system', labelKey: 'profileTab.system' },
  { value: 'light', labelKey: 'profileTab.light' },
  { value: 'dark', labelKey: 'profileTab.dark' },
];

const LANGUAGE_OPTIONS: { value: LanguagePreference; labelKey: 'profileTab.english' | 'profileTab.amharic' }[] = [
  { value: 'en', labelKey: 'profileTab.english' },
  { value: 'am', labelKey: 'profileTab.amharic' },
];

export default function ProfileTab() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const me = useMe();
  const updateMe = useUpdateMe();
  const { themePreference, setThemePreference, setLanguage } = usePreferences();
  const [language, setLanguageState] = React.useState<LanguagePreference>(() => (i18n.language === 'am' ? 'am' : 'en'));
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [phone, setPhone] = React.useState('');

  React.useEffect(() => {
    const syncFromI18n = (lng: string) => {
      setLanguageState(lng === 'am' ? 'am' : 'en');
    };

    syncFromI18n(i18n.language);
    i18n.on('languageChanged', syncFromI18n);
    return () => {
      i18n.off('languageChanged', syncFromI18n);
    };
  }, []);

  React.useEffect(() => {
    if (!me.data) return;
    setName(String(me.data.name ?? ''));
    setUsername(String(me.data.username ?? ''));
    setPhone(String(me.data.phone_number ?? ''));
  }, [me.data]);

  const accountName = String(me.data?.name ?? t('profileTab.guardian'));
  const accountEmail = me.data?.email;
  const accountPhone = me.data?.phone_number;
  const accountUsername = me.data?.username;
  const role = String(me.data?.role ?? t('profileTab.parent'));
  const trimmedName = name.trim();
  const trimmedUsername = username.trim();
  const trimmedPhone = phone.trim();
  const hasProfileChanges =
    trimmedName !== String(me.data?.name ?? '').trim() ||
    trimmedUsername !== String(me.data?.username ?? '').trim() ||
    trimmedPhone !== String(me.data?.phone_number ?? '').trim();
  const saveDisabled = !hasProfileChanges || updateMe.isPending || !trimmedName;

  const handleLanguageChange = React.useCallback(
    async (nextLanguage: LanguagePreference) => {
      await setLanguage(nextLanguage);
      await setAppLanguage(nextLanguage);
      updateMe.mutate({ language_preference: nextLanguage });
    },
    [setLanguage, updateMe]
  );

  const handleSaveProfile = React.useCallback(() => {
    if (saveDisabled) return;
    updateMe.mutate({
      name: trimmedName,
      username: trimmedUsername || undefined,
      phone_number: trimmedPhone || undefined,
    });
  }, [saveDisabled, trimmedName, trimmedUsername, trimmedPhone, updateMe]);

  return (
    <ScreenShell title={t('profileTab.title')} subtitle={t('profileTab.subtitle')}>
      {me.isLoading ? (
        <ThemedText style={{ textAlign: 'center' }}>{t('common.loading')}</ThemedText>
      ) : null}
      {me.error ? (
        <ThemedText style={{ color: theme.destructive, textAlign: 'center' }}>
          {(me.error as any)?.message ?? t('profileTab.failed')}
        </ThemedText>
      ) : null}

      {!me.isLoading && !me.error && (
        <>
          <Card style={styles.heroCard}>
            <AppBrand compact subtitle={t('profileTab.signedInAs')} />
            <View style={styles.identityRow}>
              <View style={[styles.avatar, { backgroundColor: `${theme.tint}18` }]}>
                <UserRound size={28} color={theme.tint} />
              </View>
              <View style={styles.identityCopy}>
                <ThemedText type="subtitle" style={styles.name}>
                  {valueOrFallback(accountName, t('profileTab.notProvided'))}
                </ThemedText>
                <StatusBadge label={role} tone="info" />
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {t('profileTab.accountInfo')}
            </ThemedText>
            <InfoRow icon={<Mail size={18} color={theme.icon} />} label={t('profileTab.email')} value={accountEmail} fallback={t('profileTab.notProvided')} />
            <InfoRow icon={<UserRound size={18} color={theme.icon} />} label={t('profileTab.username')} value={accountUsername} fallback={t('profileTab.notProvided')} />
            <InfoRow icon={<Phone size={18} color={theme.icon} />} label={t('profileTab.phone')} value={accountPhone} fallback={t('profileTab.notProvided')} />
            <InfoRow label={t('profileTab.role')} value={role} fallback={t('profileTab.notProvided')} />
          </Card>

          <Card style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {t('profileTab.editProfile')}
            </ThemedText>
            <Field label={t('profileTab.name')} value={name} onChangeText={setName} placeholder={t('profileTab.namePlaceholder')} />
            <Field label={t('profileTab.username')} value={username} onChangeText={setUsername} placeholder={t('profileTab.usernamePlaceholder')} autoCapitalize="none" />
            <Field label={t('profileTab.phone')} value={phone} onChangeText={setPhone} placeholder={t('profileTab.phonePlaceholder')} keyboardType="phone-pad" />
            {updateMe.error ? (
              <ThemedText style={{ color: theme.destructive }}>
                {(updateMe.error as any)?.message ?? t('profileTab.updateFailed')}
              </ThemedText>
            ) : null}
            {updateMe.isSuccess && !hasProfileChanges ? (
              <ThemedText style={{ color: theme.tint }}>{t('profileTab.updateSuccess')}</ThemedText>
            ) : null}
            <Button disabled={saveDisabled} onPress={handleSaveProfile}>
              <ThemedText lightColor="#ffffff" darkColor="#020617" type="defaultSemiBold">
                {updateMe.isPending ? t('profileTab.saving') : t('profileTab.saveChanges')}
              </ThemedText>
            </Button>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {t('profileTab.appPreferences')}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>{t('profileTab.chooseTheme')}</ThemedText>
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
            <ThemedText style={{ color: theme.textSecondary }}>{t('profileTab.chooseLanguage')}</ThemedText>
            <View style={styles.chipRow}>
              {LANGUAGE_OPTIONS.map((item) => (
                <FilterChip
                  key={item.value}
                  label={t(item.labelKey)}
                  selected={language === item.value}
                  onPress={() => void handleLanguageChange(item.value)}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {t('profileTab.support')}
            </ThemedText>
            <SupportAction
              icon={<Headphones size={18} color={theme.icon} />}
              title={t('profileTab.helpDesk')}
              subtitle={t('profileTab.helpDeskSubtitle')}
              onPress={() => router.push('/modals/helpdesk' as any)}
            />
            <SupportAction
              icon={<MessageCircle size={18} color={theme.icon} />}
              title={t('profileTab.liveChat')}
              subtitle={t('profileTab.liveChatSubtitle')}
              onPress={() => router.push('/modals/live-chat' as any)}
            />
          </Card>

          <Button variant="outline" onPress={() => void logout()}>
            <ThemedText>{t('profileTab.logout')}</ThemedText>
          </Button>
          <View style={styles.bottomSpacer} />
        </>
      )}
    </ScreenShell>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'phone-pad';
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>{label}</ThemedText>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function InfoRow({ icon, label, value, fallback }: { icon?: React.ReactNode; label: string; value?: unknown; fallback: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      {icon ? <View style={styles.infoIcon}>{icon}</View> : null}
      <View style={styles.infoCopy}>
        <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>{label}</ThemedText>
        <ThemedText>{valueOrFallback(value, fallback)}</ThemedText>
      </View>
    </View>
  );
}

function SupportAction({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Button variant="outline" onPress={onPress} style={styles.supportAction}>
      <View style={styles.supportIcon}>{icon}</View>
      <View style={styles.supportCopy}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>{subtitle}</ThemedText>
      </View>
    </Button>
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
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: 24,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  infoIcon: {
    width: 34,
    alignItems: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  field: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  supportAction: {
    height: 'auto',
    justifyContent: 'flex-start',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  supportIcon: {
    width: 34,
    alignItems: 'center',
  },
  supportCopy: {
    flex: 1,
    gap: 2,
  },
  bottomSpacer: {
    height: Spacing.five,
  },
});

