import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BellRing, ChevronDown, ChevronUp, CircleDollarSign, MapPinned, UserRoundCheck } from 'lucide-react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HelpDeskModal() {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'icon');
  const iconColor = useThemeColor({}, 'text');
  const [expandedKey, setExpandedKey] = React.useState<string | null>('tracking');

  const helpSections = [
    {
      key: 'tracking',
      title: 'How to track your child',
      icon: <MapPinned color={iconColor} size={16} />,
      steps: [
        'Open the Children tab and select your child.',
        'Tap Live Tracking on the child details screen.',
        'Use Retry Check if location data does not refresh.',
      ],
    },
    {
      key: 'notifications',
      title: 'Notifications not working?',
      icon: <BellRing color={iconColor} size={16} />,
      steps: [
        'Confirm app notification permission is enabled.',
        'Disable battery optimization for this app.',
        'Make sure mobile data or Wi-Fi is active.',
        'Pull down to refresh the Notifications tab.',
        'Log out and sign in again to refresh your session.',
      ],
    },
    {
      key: 'billing',
      title: 'Billing and payment issues',
      icon: <CircleDollarSign color={iconColor} size={16} />,
      steps: [
        'Refresh the Billing tab after making a payment.',
        'If a payment fails but money is deducted, wait a few minutes and check again.',
        'Share the transaction reference with admin if the status remains incorrect.',
      ],
    },
    {
      key: 'access',
      title: 'No access to Billing or Notifications',
      icon: <UserRoundCheck color={iconColor} size={16} />,
      steps: [
        'Your account must have at least one student assigned by admin.',
        'Contact admin and request student assignment to your account.',
        'Tap Retry Check after assignment to refresh access.',
      ],
    },
  ] as const;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText type="defaultSemiBold">Help Desk</ThemedText>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.closeButton}>
          <ThemedText type="link">Close</ThemedText>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.heroCard, { borderColor, backgroundColor: cardBackground }]}>
          <Image
            source={require('@/assets/images/illustrations/support-hero.svg')}
            style={styles.heroImage}
            contentFit="contain"
          />
          <ThemedText type="subtitle">How can we help?</ThemedText>
          <ThemedText style={{ color: muted }}>
            Tap any topic below to expand steps. You can open Live Chat directly from Settings.
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
