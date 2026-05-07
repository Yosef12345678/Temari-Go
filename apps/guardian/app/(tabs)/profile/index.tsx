import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { CircleHelp, Globe, LogOut, MessageCircleMore, MoonStar, ShieldCheck, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const me = useMe();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const mutedText = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'icon');
  const heroBackground = useThemeColor({ light: '#eef4ff', dark: '#0f1d34' }, 'background');
  const [themeEnabled, setThemeEnabled] = React.useState(false);
  const [language, setLanguage] = React.useState<'english' | 'amharic'>('english');

  const accountName = String(me.data?.name ?? 'Guardian');
  const accountEmail = String(me.data?.email ?? '—');
  const accountPhone = String(me.data?.phone_number ?? '—');
  const role = String(me.data?.role ?? 'Parent');
  const serverLang = String(me.data?.language_preference ?? '—');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={me.isRefetching} onRefresh={() => void me.refetch()} />}>
        <View style={[styles.titleCard, { borderColor, backgroundColor: heroBackground }]}>
          <ThemedText type="title">Profile</ThemedText>
          <ThemedText style={{ color: mutedText }}>Manage account, preferences, and support.</ThemedText>
        </View>

        {me.isLoading ? <ThemedText>Loading…</ThemedText> : null}
        {me.error ? (
          <ThemedText style={[styles.errorText, { color: errorColor }]}>{(me.error as any)?.message ?? 'Failed'}</ThemedText>
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
              <ThemedText type="defaultSemiBold">{accountName}</ThemedText>
              <ThemedText>{accountEmail}</ThemedText>
              <View style={styles.badges}>
                <Badge variant="secondary">
                  <ThemedText>{role}</ThemedText>
                </Badge>
                <Badge variant="outline">
                  <ThemedText>Lang: {serverLang}</ThemedText>
                </Badge>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            <SettingRow
              icon={<UserRound color={iconColor} size={16} />}
              label="Phone"
              value={accountPhone}
              borderColor={borderColor}
            />
            <SettingRow
              icon={<ShieldCheck color={iconColor} size={16} />}
              label="Role"
              value={role}
              borderColor={borderColor}
            />
          </CardContent>
        </Card>

        <Card style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            <View style={[styles.prefRow, { borderColor }]}>
              <View style={styles.prefLeft}>
                <Globe color={iconColor} size={16} />
                <View>
                  <ThemedText type="defaultSemiBold">Language</ThemedText>
                  <ThemedText>Select app language</ThemedText>
                </View>
              </View>
              <View style={styles.langActions}>
                <Button
                  variant={language === 'english' ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setLanguage('english')}>
                  <ThemedText>English</ThemedText>
                </Button>
                <Button
                  variant={language === 'amharic' ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setLanguage('amharic')}>
                  <ThemedText>Amharic</ThemedText>
                </Button>
              </View>
            </View>

            <Separator />

            <View style={[styles.prefRow, { borderColor }]}>
              <View style={styles.prefLeft}>
                <MoonStar color={iconColor} size={16} />
                <View>
                  <ThemedText type="defaultSemiBold">Theme</ThemedText>
                  <ThemedText>Dark mode toggle (placeholder)</ThemedText>
                </View>
              </View>
              <Switch
                checked={themeEnabled}
                onCheckedChange={(checked) => {
                  setThemeEnabled(Boolean(checked));
                  Alert.alert('Theme toggle', 'Theme switching will be connected in the next iteration.');
                }}
              />
            </View>
          </CardContent>
        </Card>

        <Card style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent style={styles.sectionContent}>
            <Pressable
              accessibilityRole="button"
              style={[styles.supportButton, { borderColor }]}
              onPress={() => router.push('/modals/helpdesk' as any)}>
              <View style={styles.prefLeft}>
                <CircleHelp color={iconColor} size={16} />
                <View>
                  <ThemedText type="defaultSemiBold">Help Desk</ThemedText>
                  <ThemedText>View step-by-step help topics</ThemedText>
                </View>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.supportButton, { borderColor }]}
              onPress={() => router.push('/modals/live-chat' as any)}>
              <View style={styles.prefLeft}>
                <MessageCircleMore color={iconColor} size={16} />
                <View>
                  <ThemedText type="defaultSemiBold">Live Chat</ThemedText>
                  <ThemedText>Chat directly with support</ThemedText>
                </View>
              </View>
            </Pressable>
          </CardContent>
        </Card>

        <Button variant="destructive" onPress={() => void logout()}>
          <LogOut color="#ffffff" size={16} />
          <ThemedText>Log out</ThemedText>
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  scrollBody: { gap: 12, paddingBottom: 28 },
  titleCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  heroCard: {
    borderWidth: 1,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroText: {
    gap: 4,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sectionCard: {
    borderWidth: 1,
  },
  sectionContent: {
    gap: 10,
  },
  prefRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  langActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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

