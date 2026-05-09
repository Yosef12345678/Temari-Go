import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BellRing, ChevronDown, ChevronUp, CircleDollarSign, MapPinned, UserRoundCheck } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HelpDeskModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'icon');
  const iconColor = useThemeColor({}, 'text');
  const [expandedKey, setExpandedKey] = React.useState<string | null>('tracking');

  const helpSections = [
    {
      key: 'tracking',
      title: t('helpdesk.trackingTitle'),
      icon: <MapPinned color={iconColor} size={16} />,
      steps: [
        t('helpdesk.trackingStep1'),
        t('helpdesk.trackingStep2'),
        t('helpdesk.trackingStep3'),
      ],
    },
    {
      key: 'notifications',
      title: t('helpdesk.notificationsTitle'),
      icon: <BellRing color={iconColor} size={16} />,
      steps: [
        t('helpdesk.notificationsStep1'),
        t('helpdesk.notificationsStep2'),
        t('helpdesk.notificationsStep3'),
        t('helpdesk.notificationsStep4'),
        t('helpdesk.notificationsStep5'),
      ],
    },
    {
      key: 'billing',
      title: t('helpdesk.billingTitle'),
      icon: <CircleDollarSign color={iconColor} size={16} />,
      steps: [
        t('helpdesk.billingStep1'),
        t('helpdesk.billingStep2'),
        t('helpdesk.billingStep3'),
      ],
    },
    {
      key: 'access',
      title: t('helpdesk.accessTitle'),
      icon: <UserRoundCheck color={iconColor} size={16} />,
      steps: [
        t('helpdesk.accessStep1'),
        t('helpdesk.accessStep2'),
        t('helpdesk.accessStep3'),
      ],
    },
  ] as const;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText type="defaultSemiBold">{t('helpdesk.title')}</ThemedText>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.closeButton}>
          <ThemedText type="link">{t('common.cancel')}</ThemedText>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.heroCard, { borderColor, backgroundColor: cardBackground }]}>
          <Image
            source={require('@/assets/images/illustrations/support-hero.svg')}
            style={styles.heroImage}
            contentFit="contain"
          />
          <ThemedText type="subtitle">{t('helpdesk.heroTitle')}</ThemedText>
          <ThemedText style={{ color: muted }}>
            {t('helpdesk.heroSubtitle')}
          </ThemedText>
        </View>

        {helpSections.map((section) => {
          const expanded = expandedKey === section.key;
          return (
            <View key={section.key} style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setExpandedKey(expanded ? null : section.key)}
                style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  {section.icon}
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    {section.title}
                  </ThemedText>
                </View>
                {expanded ? <ChevronUp color={iconColor} size={18} /> : <ChevronDown color={iconColor} size={18} />}
              </Pressable>
              {expanded ? (
                <View style={styles.stepsWrap}>
                  {section.steps.map((step, index) => (
                    <View key={`${section.key}-${index}`} style={styles.stepRow}>
                      <ThemedText style={[styles.stepIndex, { color: muted }]}>{index + 1}.</ThemedText>
                      <ThemedText style={styles.stepText}>{step}</ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeButton: { paddingVertical: 6, paddingHorizontal: 10 },
  body: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  heroImage: {
    width: '100%',
    height: 92,
    marginBottom: 2,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stepsWrap: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepIndex: {
    width: 16,
    marginTop: 1,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
  },
});
