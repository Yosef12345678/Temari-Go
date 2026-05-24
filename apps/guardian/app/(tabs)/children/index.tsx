import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Ellipsis,
  GraduationCap,
  IdCard,
  LocateFixed,
  MapPin,
  Satellite,
  School,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RestrictedTabContent } from '@/components/access/restricted-tab-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useParentAccess } from '@/src/hooks/useParentAccess';
import { useStudentsList } from '@/src/hooks/useStudents';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { StudentListItem } from '@/src/types/student';

export default function ChildrenTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const students = useStudentsList();
  const access = useParentAccess();
  const { t } = useTranslation();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const errorColor = useThemeColor({}, 'destructive');
  const iconColor = useThemeColor({}, 'icon');
  const muted = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const readinessBlue = useThemeColor({ light: '#2563eb', dark: '#60a5fa' }, 'tint');
  const successColor = useThemeColor({ light: '#059669', dark: '#34d399' }, 'tint');
  const heroBackground = useThemeColor({ light: '#5ea2ff', dark: '#1f4fa3' }, 'tint');
  const heroBackgroundSecondary = useThemeColor({ light: '#4b8eff', dark: '#2b5fc0' }, 'tint');
  const heroStatCard = useThemeColor({ light: '#ffffff', dark: '#0f172a' }, 'background');
  const liveChipBackground = useThemeColor({ light: '#e9f9f2', dark: '#083b2d' }, 'background');
  const subtleCard = useThemeColor({ light: '#f8fbff', dark: '#0f172a' }, 'background');
  const surfaceSoft = useThemeColor({ light: '#f7f9fc', dark: '#0b1220' }, 'background');
  const chipSoft = useThemeColor({ light: '#f3f6fb', dark: '#101a2e' }, 'background');
  const shadowColor = useThemeColor({ light: '#000000', dark: '#000000' }, 'text');
  const studentCount = students.data?.length ?? 0;
  const readyCount = students.data?.filter((student) => hasTrackableData(student)).length ?? 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <RestrictedTabContent
        resolving={access.isResolving}
        restricted={access.isRestricted}
        title={t('childrenTab.restrictedTitle')}
        subtitle={t('childrenTab.restrictedSubtitle')}
        onRetry={() => {
          void access.refetch();
        }}>
      <FlatList
        data={students.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshing={students.isRefetching}
        onRefresh={() => void students.refetch()}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingLeft}>
                <View style={[styles.logoShell, { borderColor }]}>
                  <Image source={require('@/assets/images/transport.svg')} style={styles.heroLogo} contentFit="contain" />
                </View>
                <View>
                  <ThemedText style={styles.greetingTitle}>{t('childrenTab.greetingTitle')}</ThemedText>
                  <ThemedText numberOfLines={1} style={{ color: muted }}>
                    {t('childrenTab.greetingRole')}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.readinessTag, { borderColor, backgroundColor: subtleCard }]}>
                <View style={styles.readinessIconWrap}>
                  <Satellite color={readinessBlue} size={14} />
                </View>
                <View>
                  <ThemedText style={styles.readinessTitle} type="defaultSemiBold">
                    {t('childrenTab.childCount', { count: studentCount })}
                  </ThemedText>
                  <ThemedText style={styles.readinessText}>{t('childrenTab.readyToTrack')}</ThemedText>
                </View>
                <ChevronRight color={iconColor} size={13} />
              </View>
            </View>

            <View
              style={[
                styles.heroCard,
                { borderColor, backgroundColor: heroBackground, shadowColor },
              ]}>
              <View style={[styles.heroGradientOverlay, { backgroundColor: heroBackgroundSecondary }]} />
              <View style={styles.heroTextWrap}>
                <ThemedText style={styles.heroTitle}>{t('childrenTab.heroTitle')}</ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  {t('childrenTab.heroSubtitle')}
                </ThemedText>
              </View>
              <View style={styles.heroArtWrap}>
                <Image
                  source={require('@/assets/images/school_bus1.png')}
                  style={styles.heroBusImage}
                  contentFit="contain"
                />
              </View>
              <View style={[styles.heroStatsPanel, { borderColor, backgroundColor: heroStatCard }]}>
                <View style={styles.heroStatCell}>
                  <View style={[styles.heroStatIconWrap, { backgroundColor: '#e7f0ff' }]}>
                    <Satellite color={readinessBlue} size={16} />
                  </View>
                  <View>
                    <ThemedText style={styles.heroStatValue} type="defaultSemiBold">
                      {String(studentCount)}
                    </ThemedText>
                    <ThemedText style={styles.heroStatLabel}>{t('childrenTab.assignedChildren')}</ThemedText>
                  </View>
                </View>
                <View style={[styles.heroStatDivider, { backgroundColor: borderColor }]} />
                <View style={styles.heroStatCell}>
                  <View style={[styles.heroStatIconWrap, { backgroundColor: '#e8f8ef' }]}>
                    <MapPin color={successColor} size={16} />
                  </View>
                  <View>
                    <ThemedText style={styles.heroStatValue} type="defaultSemiBold">
                      {String(readyCount)}
                    </ThemedText>
                    <ThemedText style={styles.heroStatLabel}>{t('childrenTab.readyForLiveMap')}</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">{t('childrenTab.yourChildren')}</ThemedText>
              <View style={[styles.sectionAccent, { backgroundColor: tint }]} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={[styles.card, { borderColor, backgroundColor: cardBackground }]}>
            <CardContent style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('childrenTab.accessibilityOpenDetails', { name: resolveStudentName(item, t) })}
                  onPress={() => router.push(`/children/${item.id}` as any)}
                  style={styles.cardDetailsButton}>
                  <View style={[styles.avatarShell, { backgroundColor: surfaceSoft }]}>
                    <Avatar className="size-12" alt={`${resolveStudentName(item, t)} avatar`}>
                      <AvatarImage
                        source={
                          resolveAvatarUrl(item)
                            ? { uri: resolveAvatarUrl(item) }
                            : require('@/assets/images/placeholders/student-default.svg')
                        }
                      />
                      <AvatarFallback>
                        <ThemedText type="defaultSemiBold" style={styles.avatarFallbackText}>
                          {getInitials(item)}
                        </ThemedText>
                      </AvatarFallback>
                    </Avatar>
                  </View>
                  <View style={styles.nameSection}>
                    <View style={styles.nameRow}>
                      <ThemedText type="defaultSemiBold" style={styles.studentName}>
                        {resolveStudentName(item, t)}
                      </ThemedText>
                      {hasTrackableData(item) ? (
                        <View style={[styles.liveChip, { backgroundColor: liveChipBackground }]}>
                          <View style={[styles.liveDot, { backgroundColor: successColor }]} />
                          <ThemedText style={styles.liveChipText}>{t('childrenTab.liveReady')}</ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.metaRow}>
                      <School color={iconColor} size={14} />
                      <ThemedText style={styles.schoolText}>{resolveSchoolName(item, t)}</ThemedText>
                    </View>
                    <View style={styles.badges}>
                      <View style={[styles.chip, { backgroundColor: chipSoft, borderColor }]}>
                        <GraduationCap color={iconColor} size={13} />
                        <ThemedText style={styles.chipText}>{resolveGradeLabel(item, t)}</ThemedText>
                      </View>
                      <View style={[styles.chip, { backgroundColor: chipSoft, borderColor }]}>
                        <IdCard color={iconColor} size={13} />
                        <ThemedText style={styles.chipText}>{resolveStudentIdLabel(item, t)}</ThemedText>
                      </View>
                    </View>
                  </View>
                </Pressable>
                <Pressable accessibilityRole="button" style={[styles.menuButton, { backgroundColor: chipSoft, shadowColor }]}>
                  <Ellipsis color={iconColor} size={18} />
                </Pressable>
              </View>

              <View style={[styles.cardBottomRow, { borderColor }]}>
                <View style={styles.statusBox}>
                  <View style={[styles.statusIconShell, { backgroundColor: subtleCard }]}>
                    <LocateFixed color={tint} size={18} />
                  </View>
                  <ThemedText style={styles.statusText}>{resolveStatusText(item, t)}</ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('childrenTab.accessibilityTrackLive', { name: resolveStudentName(item, t) })}
                  onPress={() => router.push(`/children/${item.id}/tracking` as any)}
                  style={[styles.trackButton, { backgroundColor: tint }]}>
                  <LocateFixed color="#f8fafc" size={14} />
                  <ThemedText style={styles.trackButtonText} type="defaultSemiBold">{t('childrenTab.trackLive')}</ThemedText>
                  <ChevronRight color="#f8fafc" size={14} />
                </Pressable>
              </View>
            </CardContent>
          </Card>
        )}
        ListEmptyComponent={
          students.isLoading ? null : (
            <Card style={[styles.stateCard, { borderColor, backgroundColor: cardBackground }]}>
              <CardContent style={styles.stateCardBody}>
                <ThemedText type="defaultSemiBold">{t('childrenTab.emptyTitle')}</ThemedText>
                <ThemedText style={styles.subtitle}>
                  {t('childrenTab.emptySubtitle')}
                </ThemedText>
                <Pressable accessibilityRole="button" style={[styles.retryButton, { borderColor }]} onPress={() => void access.refetch()}>
                  <ThemedText type="defaultSemiBold">{t('childrenTab.emptyCta')}</ThemedText>
                </Pressable>
              </CardContent>
            </Card>
          )
        }
        ListFooterComponent={
          <View style={styles.footerWrap}>
            {students.isLoading ? (
              <Card style={[styles.stateCard, { borderColor, backgroundColor: cardBackground }]}>
                <CardContent style={styles.stateCardBody}>
                  <ThemedText type="defaultSemiBold">{t('childrenTab.loadingTitle')}</ThemedText>
                  <ThemedText style={styles.subtitle}>{t('childrenTab.loadingSubtitle')}</ThemedText>
                </CardContent>
              </Card>
            ) : null}
            {students.error ? (
              <Card style={[styles.stateCard, { borderColor, backgroundColor: cardBackground }]}>
                <CardContent style={styles.stateCardBody}>
                  <ThemedText type="defaultSemiBold" style={{ color: errorColor }}>
                    {t('childrenTab.errorTitle')}
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    {(students.error as any)?.message ?? t('childrenTab.errorFallback')}
                  </ThemedText>
                  <Pressable accessibilityRole="button" style={[styles.retryButton, { borderColor }]} onPress={() => void students.refetch()}>
                    <ThemedText type="defaultSemiBold">{t('childrenTab.errorCta')}</ThemedText>
                  </Pressable>
                </CardContent>
              </Card>
            ) : null}
            <Card style={[styles.safetyCard, { borderColor, backgroundColor: cardBackground }]}>
              <CardContent style={styles.safetyCardBody}>
                <View style={[styles.safetyIconWrap, { backgroundColor: subtleCard }]}>
                  <ShieldCheck color={successColor} size={18} />
                </View>
                <View style={styles.safetyTextWrap}>
                  <ThemedText type="defaultSemiBold">{t('childrenTab.safetyTitle')}</ThemedText>
                  <ThemedText style={styles.subtitle}>{t('childrenTab.safetySubtitle')}</ThemedText>
                </View>
                <ChevronRight color={iconColor} size={16} />
              </CardContent>
            </Card>
          </View>
        }
      />
      </RestrictedTabContent>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerWrap: { gap: 14, marginBottom: 14 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  greetingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, flex: 1 },
  logoShell: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTitle: { fontSize: 20, lineHeight: 24, fontWeight: '700' },
  heroCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 16,
    gap: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.45,
  },
  heroLogo: { width: 36, height: 36 },
  readinessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    height: 34,
    paddingHorizontal: 10,
    paddingVertical: 0,
    flexShrink: 0,
    maxWidth: 134,
    marginLeft: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  readinessIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  readinessTitle: { fontSize: 11, lineHeight: 13 },
  readinessText: { fontSize: 10, lineHeight: 12, opacity: 0.82 },
  heroTextWrap: { gap: 8, width: '58%', zIndex: 2 },
  heroTitle: { color: '#f8fafc', fontSize: 18, lineHeight: 25, fontWeight: '700' },
  heroSubtitle: { color: '#eff6ff', opacity: 0.96, fontSize: 11, lineHeight: 16 },
  heroArtWrap: {
    position: 'absolute',
    right: -28,
    top: 54,
    width: 160,
    height: 130,
    zIndex: 1,
    pointerEvents: 'none',
  },
  heroBusImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 150,
    height: 120,
  },
  heroStatsPanel: {
    borderWidth: 1,
    borderRadius: 28,
    height: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  heroStatCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroStatIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: 10, opacity: 0.15 },
  heroStatValue: { fontSize: 18, lineHeight: 20 },
  heroStatLabel: { fontSize: 10, opacity: 0.72 },
  sectionHeader: { gap: 8 },
  sectionAccent: { width: 18, height: 3, borderRadius: 999 },
  listContent: { paddingBottom: 24 },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 0,
    marginBottom: 12,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardDetailsButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  nameSection: { gap: 6, flexShrink: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  studentName: { fontSize: 16, lineHeight: 20 },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 36,
    paddingVertical: 0,
  },
  liveDot: { width: 7, height: 7, borderRadius: 999 },
  liveChipText: { fontSize: 12, color: '#047857', fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  subtitle: { opacity: 0.76 },
  schoolText: { opacity: 0.76, fontSize: 13, lineHeight: 17, flexShrink: 1 },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  badgeInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardBottomRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusIconShell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { opacity: 0.74, fontSize: 12, flex: 1 },
  trackButton: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  trackButtonText: { color: '#f8fafc' },
  stateCard: {
    borderWidth: 1,
    borderRadius: 16,
  },
  stateCardBody: {
    paddingVertical: 14,
    gap: 6,
  },
  retryButton: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerWrap: { gap: 12, marginTop: 2 },
  safetyCard: { borderWidth: 1, borderRadius: 16 },
  safetyCardBody: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  safetyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTextWrap: { flex: 1, gap: 2 },
  avatarShell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarFallbackText: {
    color: '#0f172a',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, opacity: 0.9 },
});

function getInitials(student: StudentListItem) {
  const source = student as Record<string, unknown>;
  const name = String(source.full_name ?? source.fullName ?? source.student_name ?? source.name ?? '').trim();
  if (!name) return 'S';
  const parts = name.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function resolveStudentName(student: StudentListItem, t: (key: string, options?: any) => string) {
  const source = student as Record<string, unknown>;
  const fallback = t('students.fallbackStudent');
  return String(source.full_name ?? source.fullName ?? source.student_name ?? source.name ?? fallback).trim() || fallback;
}

function resolveAvatarUrl(student: StudentListItem) {
  const source = student as Record<string, unknown>;
  return String(source.avatarUrl ?? source.avatar_url ?? source.photoUrl ?? source.photo_url ?? '').trim();
}

function resolveSchoolName(student: StudentListItem, t: (key: string, options?: any) => string) {
  const source = student as Record<string, unknown>;
  const routeAssignments = Array.isArray(source.routeAssignments) ? source.routeAssignments : Array.isArray(source.route_assignments) ? source.route_assignments : [];
  const firstAssignment = routeAssignments[0] as Record<string, unknown> | undefined;
  const route = (firstAssignment?.route ?? source.route) as Record<string, unknown> | undefined;
  const bus = (route?.bus ?? source.bus ?? source.assignedBus ?? source.assigned_bus) as Record<string, unknown> | undefined;
  const school = (bus?.school ?? source.school) as Record<string, unknown> | undefined;
  const value = String(source.school_name ?? source.schoolName ?? school?.name ?? school?.school_name ?? bus?.school_name ?? bus?.schoolName ?? source.school ?? '').trim();
  return value || t('students.schoolUnavailable');
}

function resolveGradeLabel(student: StudentListItem, t: (key: string, options?: any) => string) {
  const source = student as Record<string, unknown>;
  const grade = source.grade ?? source.gradeName ?? source.class_name ?? source.className;
  return grade === undefined || grade === null || String(grade).trim() === ''
    ? t('students.gradeUnknown')
    : t('students.gradeValue', { grade: String(grade) });
}

function resolveStudentIdLabel(student: StudentListItem, t: (key: string, options?: any) => string) {
  const source = student as Record<string, unknown>;
  const value = String(source.studentId ?? source.student_id ?? source.id ?? '').trim();
  return value ? t('students.idValue', { id: value }) : t('students.idUnknown');
}

function resolveStatusText(student: StudentListItem, t: (key: string, options?: any) => string) {
  const source = student as Record<string, unknown>;
  const rawValue = source.lastSeenAt ?? source.last_seen_at ?? source.updatedAt ?? source.updated_at;
  const value = String(rawValue ?? '').trim();
  if (!value) return t('students.trackingStatusDefault');

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return t('students.lastUpdateRaw', { value });
  }
  const time = parsed.toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return t('students.lastUpdateTime', { time });
}

function hasTrackableData(student: StudentListItem) {
  const source = student as Record<string, unknown>;
  const busId = String(source.busId ?? source.bus_id ?? '').trim();
  const hasCoords = source.home_latitude != null && source.home_longitude != null;
  return Boolean(busId || hasCoords);
}

