import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { CircleHelp, Globe, LogOut, Mail, MessageCircleMore, MoonStar, Phone, ShieldCheck, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/src/hooks/useAuth';
import { useMe } from '@/src/hooks/useMe';
import { useThemeColor } from '@/hooks/use-theme-color';
import { i18n, setAppLanguage } from '@/src/i18n';

export default function ProfileTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const me = useMe();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const tint = useThemeColor({}, 'tint');
  const [themeEnabled, setThemeEnabled] = React.useState(false);
  const [language, setLanguage] = React.useState<'english' | 'amharic'>(() => (i18n.language === 'am' ? 'amharic' : 'english'));

  React.useEffect(() => {
    const syncFromI18n = (lng: string) => {
      setLanguage(lng === 'am' ? 'amharic' : 'english');
    };

    syncFromI18n(i18n.language);
    i18n.on('languageChanged', syncFromI18n);
    return () => {
      i18n.off('languageChanged', syncFromI18n);
    };
  }, []);

  const accountName = String(me.data?.name ?? t('profileTab.guardian'));
  const accountEmail = String(me.data?.email ?? '—');
  const accountPhone = String(me.data?.phone_number ?? '—');
  const role = String(me.data?.role ?? t('profileTab.parent'));
  const serverLang = String(me.data?.language_preference ?? '—');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={me.isRefetching} onRefresh={() => void me.refetch()} />}>
        <View style={[styles.titleCard, { borderColor, backgroundColor: cardBackground }]}>
          <View style={[styles.titleIcon, { backgroundColor: tint }]}>
            <UserRound color="#ffffff" size={22} />
          </View>
          <View style={styles.titleText}>
            <ThemedText type="title">{t('profileTab.title')}</ThemedText>
            <ThemedText style={{ color: mutedText }}>{t('profileTab.subtitle')}</ThemedText>
          </View>
        </View>

        {me.isLoading ? <ThemedText>{t('common.loading')}</ThemedText> : null}
        {me.error ? (
          <ThemedText style={[styles.errorText, { color: errorColor }]}>{(me.error as any)?.message ?? t('profileTab.failed')}</ThemedText>
        ) : null}

        <Card style={[styles.heroCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardContent style={styles.heroBody}>
            <Avatar className="size-14" alt={`${accountName} avatar`}>
              <AvatarImage source={{ uri: String((me.data as any)?.avatar_url ?? '') }} />
              <AvatarFallback>
                <ThemedText type="defaultSemiBold">{getInitials(accountName)}</ThemedText>
              </AvatarFallback>
            </Avatar>
            <View style={styles.heroText}>
              <ThemedText type="subtitle">{accountName}</ThemedText>
              <View style={styles.inlineMeta}>
                <Mail color={iconColor} size={14} />
                <ThemedText style={{ color: mutedText }}>{accountEmail}</ThemedText>
              </View>
              <View style={styles.badges}>
                <Badge variant="secondary">
                  <ThemedText>{role}</ThemedText>
                </Badge>
                <Badge variant="outline">
                  <ThemedText>{t('profileTab.langBadge', { language: serverLang })}</ThemedText>
                </Badge>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardHeader>
            <CardTitle>{t('profileTab.account')}</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            <SettingRow
              icon={<Phone color={iconColor} size={16} />}
              label={t('profileTab.phone')}
              value={accountPhone}
              borderColor={borderColor}
            />
            <SettingRow
              icon={<ShieldCheck color={iconColor} size={16} />}
              label={t('profileTab.role')}
              value={role}
              borderColor={borderColor}
            />
          </CardContent>
        </Card>

        <Card style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardHeader>
            <CardTitle>{t('profileTab.preferences')}</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            <View style={[styles.prefRow, { borderColor }]}>
              <View style={styles.prefLeft}>
                <Globe color={iconColor} size={16} />
                <View style={styles.prefCopy}>
                  <ThemedText type="defaultSemiBold">{t('profileTab.language')}</ThemedText>
                  <ThemedText>{t('profileTab.selectLanguage')}</ThemedText>
                </View>
              </View>
              <View style={styles.langActions}>
                <Button
                  variant={language === 'english' ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => {
                    void setAppLanguage('en');
                  }}>
                  <ThemedText>{t('profileTab.english')}</ThemedText>
                </Button>
                <Button
                  variant={language === 'amharic' ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => {
                    void setAppLanguage('am');
                  }}>
                  <ThemedText>አማርኛ</ThemedText>
                </Button>
              </View>
            </View>

            <Separator />

            <View style={[styles.prefRow, { borderColor }]}>
              <View style={styles.prefLeft}>
                <MoonStar color={iconColor} size={16} />
                <View style={styles.prefCopy}>
                  <ThemedText type="defaultSemiBold">{t('profileTab.theme')}</ThemedText>
                  <ThemedText>{t('profileTab.themePlaceholder')}</ThemedText>
                </View>
              </View>
              <Switch
                checked={themeEnabled}
                onCheckedChange={(checked) => {
                  setThemeEnabled(Boolean(checked));
                  Alert.alert(t('profileTab.themeToggleTitle'), t('profileTab.themeToggleBody'));
                }}
              />
            </View>
          </CardContent>
        </Card>

        <Card style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardHeader>
            <CardTitle>{t('profileTab.support')}</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            <Pressable
              accessibilityRole="button"
              style={[styles.supportButton, { borderColor }]}
              onPress={() => router.push('/modals/helpdesk' as any)}>
              <View style={styles.prefLeft}>
                <CircleHelp color={iconColor} size={16} />
                <View style={styles.prefCopy}>
                  <ThemedText type="defaultSemiBold">{t('profileTab.helpDesk')}</ThemedText>
                  <ThemedText>{t('profileTab.helpDeskSubtitle')}</ThemedText>
                </View>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.supportButton, { borderColor }]}
              onPress={() => router.push('/modals/live-chat' as any)}>
              <View style={styles.prefLeft}>
                <MessageCircleMore color={iconColor} size={16} />
                <View style={styles.prefCopy}>
                  <ThemedText type="defaultSemiBold">{t('profileTab.liveChat')}</ThemedText>
                  <ThemedText>{t('profileTab.liveChatSubtitle')}</ThemedText>
                </View>
              </View>
            </Pressable>
          </CardContent>
        </Card>

        <Button variant="destructive" onPress={() => void logout()}>
          <LogOut color="#ffffff" size={16} />
          <ThemedText>{t('profileTab.logout')}</ThemedText>
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, gap: 8 },
  scrollBody: { gap: 10, paddingBottom: 24 },
  titleCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  titleIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleText: { flex: 1, gap: 2 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  heroText: {
    gap: 4,
    flex: 1,
  },
  inlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
  },
  sectionContent: {
    gap: 8,
    paddingTop: 0,
  },
  prefRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  prefCopy: { flex: 1, gap: 2 },
  langActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  errorText: { fontSize: 14 },
});

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.length ? parts.map((part) => part.charAt(0).toUpperCase()).join('') : 'U';
}

function SettingRow({
  icon,
  label,
  value,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.prefRow, { borderColor }]}>
      <View style={styles.prefLeft}>
        {icon}
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
      </View>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

