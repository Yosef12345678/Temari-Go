import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, FlatList, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  BusFront,
  Bell,
  CalendarMinus2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CircleHelp,
  MapPin,
  Phone,
  UserCircle2,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusCurrent, useBusHistory } from '@/src/hooks/useLocations';
import { useAttendanceByStudent } from '@/src/hooks/useAttendance';
import { useStudentDetail } from '@/src/hooks/useStudents';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AttendanceEvent } from '@/src/types/attendance';
import type { BusLocationPoint } from '@/src/types/location';

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useStudentDetail(String(id ?? ''));
  const student = (q.data?.student ?? {}) as Record<string, unknown>;
  const busId = String(student.busId ?? student.bus_id ?? '');
  const current = useBusCurrent(busId, { refetchIntervalMs: 8_000 });
  const history = useBusHistory(busId, { limit: 6 });
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [showAllKidsTrip, setShowAllKidsTrip] = React.useState(false);
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'destructive');
  const yellow = '#f6cf47';

  const studentName = String(student.full_name ?? 'Student');
  const schoolName = String(student.school_name ?? student.schoolName ?? 'International School');
  const studentGrade = String(student.grade ?? '-');
  const studentCode = String(student.student_id ?? student.studentId ?? student.id ?? id ?? '-');

  const infoCards = [
    { key: 'student-id', title: 'Student ID', value: studentCode },
    { key: 'grade', title: 'Grade', value: studentGrade },
    { key: 'roll-number', title: 'Roll Number', value: String(student.roll_number ?? '—') },
    { key: 'section', title: 'Section', value: String(student.section ?? '—') },
  ];
  const [tabValue, setTabValue] = React.useState('overview');
  const [activeCard, setActiveCard] = React.useState(0);
  const weekRange = React.useMemo(() => getWeekRange(weekOffset), [weekOffset]);
  const attendance = useAttendanceByStudent(String(id ?? ''), {
    startDate: weekRange.start.toISOString(),
    endDate: weekRange.end.toISOString(),
  });

  const homeLat = student.home_latitude;
  const homeLng = student.home_longitude;
  const addressLabel =
    typeof homeLat === 'number' && typeof homeLng === 'number'
      ? `Home (${homeLat.toFixed(4)}, ${homeLng.toFixed(4)})`
      : 'Default address not provided';

  const timeline = React.useMemo(() => {
    const historyPoints = (history.data ?? []) as BusLocationPoint[];
    const currentPoint = current.data
      ? [
          {
            latitude: current.data.latitude,
            longitude: current.data.longitude,
            timestamp: String(current.data.timestamp ?? ''),
            speed: current.data.speed,
          } satisfies BusLocationPoint,
        ]
      : [];
    const points = [...historyPoints, ...currentPoint];
    return points
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      .sort((a, b) => String(a.timestamp ?? '').localeCompare(String(b.timestamp ?? '')));
  }, [current.data, history.data]);
  const attendanceRows = React.useMemo(
    () => buildAttendanceRows((attendance.data ?? []) as AttendanceEvent[], weekRange.start),
    [attendance.data, weekRange.start]
  );
  const etaTimeLabel = React.useMemo(() => {
    if (!current.data?.timestamp) return null;
    const ts = new Date(String(current.data.timestamp));
    if (Number.isNaN(ts.getTime())) return null;
    const etaDate = new Date(ts.getTime() + 5 * 60 * 1000);
    return etaDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [current.data?.timestamp]);
  const isRefreshing = q.isRefetching || current.isRefetching || history.isRefetching || attendance.isRefetching;
  const handleRefresh = React.useCallback(() => {
    void q.refetch();
    if (busId) {
      void current.refetch();
      void history.refetch();
    }
    void attendance.refetch();
  }, [attendance, busId, current, history, q]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Student</ThemedText>

      {q.isLoading ? <ThemedText>Loading…</ThemedText> : null}
      {q.error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {(q.error as any)?.message ?? 'Failed'}
        </ThemedText>
      ) : null}

      {q.data ? (
        <Tabs value={tabValue} onValueChange={setTabValue} style={styles.tabsRoot}>
          <TabsList style={styles.tabsList}>
            <TabsTrigger value="overview">
              <ThemedText>Overview</ThemedText>
            </TabsTrigger>
            <TabsTrigger value="travel">
              <ThemedText>Travel Tools</ThemedText>
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <ThemedText>Route Timeline</ThemedText>
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <ThemedText>Attendance</ThemedText>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" style={styles.tabContent}>
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
              <Card>
                <CardHeader>
                  <CardTitle>Student Identification</CardTitle>
                </CardHeader>
                <CardContent style={styles.identityBody}>
                  <View>
                    <ThemedText type="defaultSemiBold" style={styles.studentName}>
                      {studentName}
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>{schoolName}</ThemedText>
                  </View>
                  <Avatar className="size-14" alt={`${studentName} avatar`}>
                    <AvatarImage source={{ uri: String(student.avatar_url ?? student.avatarUrl ?? '') }} />
                    <AvatarFallback>
                      <ThemedText type="defaultSemiBold">{getInitials(studentName)}</ThemedText>
                    </AvatarFallback>
                  </Avatar>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <FlatList
                    data={infoCards}
                    horizontal
                    pagingEnabled
                    onMomentumScrollEnd={(event) => {
                      const width = event.nativeEvent.layoutMeasurement.width;
                      const offset = event.nativeEvent.contentOffset.x;
                      setActiveCard(Math.round(offset / Math.max(width, 1)));
                    }}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => (
                      <View style={[styles.infoCard, { borderColor }]}>
                        <ThemedText style={styles.infoTitle}>{item.title}</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                          {item.value}
                        </ThemedText>
                      </View>
                    )}
                  />
                  <View style={styles.paginationDots}>
                    {infoCards.map((item, idx) => (
                      <View
                        key={item.key}
                        style={[styles.dot, idx === activeCard ? [styles.dotActive, { backgroundColor: tint }] : undefined]}
                      />
                    ))}
                  </View>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location & Logistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open default address"
                    style={[styles.addressRow, { borderColor }]}
                    onPress={async () => {
                      if (typeof homeLat === 'number' && typeof homeLng === 'number') {
                        await Linking.openURL(`https://maps.google.com/?q=${homeLat},${homeLng}`);
                        return;
                      }
                      Alert.alert('Address unavailable', 'No default address is currently set for this student.');
                    }}>
                    <View style={styles.addressTextArea}>
                      <Badge variant="outline">
                        <ThemedText>Default Address</ThemedText>
                      </Badge>
                      <ThemedText style={styles.addressText}>{addressLabel}</ThemedText>
                    </View>
                    <ChevronRight color={iconColor} size={18} />
                  </Pressable>
                </CardContent>
              </Card>
            </ScrollView>
          </TabsContent>

          <TabsContent value="travel" style={styles.tabContent}>
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
              <Card style={[styles.travelCard, { borderColor: yellow }]}>
                <CardHeader>
                  <CardTitle>Travel Utility Menu</CardTitle>
                </CardHeader>
                <CardContent style={styles.travelMenu}>
                  <TravelActionRow
                    icon={<MapPin color="#2b2b2b" size={18} />}
                    title="View Live Map"
                    onPress={() => router.push(`/children/${id}/tracking` as any)}
                  />
                  <TravelActionRow
                    icon={<CalendarMinus2 color="#2b2b2b" size={18} />}
                    title="Mark Absence"
                    onPress={() => router.push(`/children/${id}/attendance` as any)}
                  />
                  <TravelActionRow
                    icon={<Phone color="#2b2b2b" size={18} />}
                    title="Call Driver"
                    onPress={async () => {
                      if (!busId) {
                        Alert.alert('Driver unavailable', 'No bus is currently assigned to this student.');
                        return;
                      }
                      await Linking.openURL('tel:+10000000000');
                    }}
                  />
                  <TravelActionRow
                    icon={<CircleHelp color="#2b2b2b" size={18} />}
                    title="Helpdesk"
                    onPress={() => {
                      Alert.alert('Helpdesk', 'Support is available at support@temari.app');
                    }}
                  />
                </CardContent>
              </Card>
            </ScrollView>
          </TabsContent>

          <TabsContent value="timeline" style={styles.tabContent}>
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
              <Card>
                <CardHeader style={styles.timelineTitleRow}>
                  <CardTitle>Route Progress</CardTitle>
                  <Badge variant="secondary">
                    <ThemedText>{busId ? `Bus ${busId}` : 'No bus assigned'}</ThemedText>
                  </Badge>
                </CardHeader>
                <CardContent style={styles.timelineContent}>
                  <Progress value={timelineProgress(timeline)} />
                  {history.isLoading || current.isLoading ? <ThemedText>Loading route…</ThemedText> : null}
                  {history.error || current.error ? (
                    <ThemedText style={[styles.errorText, { color: errorColor }]}>
                      {((history.error ?? current.error) as any)?.message ?? 'Failed to load route data'}
                    </ThemedText>
                  ) : null}
                  {timeline.map((point, idx) => (
                    <View key={`${point.timestamp ?? idx}-${idx}`} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View style={[styles.timelineDot, { backgroundColor: idx === timeline.length - 1 ? tint : '#7e9fff' }]} />
                        {idx < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}
                      </View>
                      <View style={styles.timelineText}>
                        <View style={styles.rowTitle}>
                          <BusFront color={iconColor} size={14} />
                          <ThemedText type="defaultSemiBold">
                            Stop {idx + 1}: {formatStopLabel(point)}
                          </ThemedText>
                        </View>
                        <ThemedText>{formatTimestamp(point.timestamp)}</ThemedText>
                      </View>
                    </View>
                  ))}
                  {timeline.length === 0 && !history.isLoading && !current.isLoading ? (
                    <ThemedText>No route points available yet.</ThemedText>
                  ) : null}
                </CardContent>
              </Card>
            </ScrollView>
          </TabsContent>

          <TabsContent value="attendance" style={styles.tabContent}>
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
              <Card style={[styles.etaCard, { borderColor: yellow }]}>
                <CardHeader style={styles.attendanceTopHeader}>
                  <View>
                    <CardTitle>Trip Status</CardTitle>
                  </View>
                  <View style={styles.headerIcons}>
                    <Bell color="#2b2b2b" size={18} />
                    <UserCircle2 color="#2b2b2b" size={20} />
                  </View>
                </CardHeader>
                <CardContent style={styles.etaContent}>
                  <View style={styles.etaRow}>
                    <Clock3 color="#2b2b2b" size={18} />
                    <View style={styles.etaTextBox}>
                      <ThemedText type="defaultSemiBold">
                        {etaTimeLabel ? 'Arriving in 5 minutes' : 'ETA unavailable right now'}
                      </ThemedText>
                      <ThemedText>{etaTimeLabel ? `Reaching by ${etaTimeLabel}` : 'Waiting for live bus timestamp'}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.metaGrid}>
                    <Badge variant="outline">
                      <ThemedText>Vehicle {busId || 'Unassigned'}</ThemedText>
                    </Badge>
                    <Badge variant="outline">
                      <ThemedText>Route Name: {String(student.route_name ?? '12')}</ThemedText>
                    </Badge>
                    <Badge variant="outline">
                      <ThemedText>Stop: {String(student.stop_name ?? 'Sector-17, Noida')}</ThemedText>
                    </Badge>
                  </View>
                </CardContent>
              </Card>

              <Card>
                <CardHeader style={styles.weekHeader}>
                  <Pressable accessibilityRole="button" style={styles.weekNavBtn} onPress={() => setWeekOffset((prev) => prev - 1)}>
                    <ChevronLeft color={iconColor} size={18} />
                  </Pressable>
                  <View style={styles.weekLabelBox}>
                    <CardTitle>This Week</CardTitle>
                    <ThemedText>{formatDateRange(weekRange.start, weekRange.end)}</ThemedText>
                  </View>
                  <Pressable accessibilityRole="button" style={styles.weekNavBtn} onPress={() => setWeekOffset((prev) => prev + 1)}>
                    <ChevronRight color={iconColor} size={18} />
                  </Pressable>
                </CardHeader>
                <CardContent style={styles.weekContent}>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: showAllKidsTrip }}
                    style={[styles.showAllToggle, { borderColor }]}
                    onPress={() => setShowAllKidsTrip((prev) => !prev)}>
                    <ThemedText type="defaultSemiBold">Show All Kids Trip</ThemedText>
                    <Badge variant={showAllKidsTrip ? 'default' : 'secondary'}>
                      <ThemedText>{showAllKidsTrip ? 'On' : 'Off'}</ThemedText>
                    </Badge>
                  </Pressable>

                  {attendance.isLoading ? <ThemedText>Loading attendance history…</ThemedText> : null}
                  {attendance.error ? (
                    <ThemedText style={[styles.errorText, { color: errorColor }]}>
                      {(attendance.error as any)?.message ?? 'Failed to load attendance history'}
                    </ThemedText>
                  ) : null}

                  {attendanceRows.map((row) => (
                    <View key={row.key} style={[styles.dayCard, row.isToday ? [styles.dayCardHighlight, { borderColor: yellow }] : [styles.dayCardMuted, { borderColor }]]}>
                      <View style={styles.dayHeader}>
                        <ThemedText type="defaultSemiBold">{row.dayLabel}</ThemedText>
                        <Badge variant={row.isToday ? 'default' : 'secondary'}>
                          <ThemedText>{row.isToday ? 'Upcoming/Active' : 'Scheduled'}</ThemedText>
                        </Badge>
                      </View>
                      <View style={styles.pickDropRow}>
                        <ThemedText>Pick up</ThemedText>
                        <ThemedText type="defaultSemiBold">{row.pickupTime}</ThemedText>
                      </View>
                      <View style={styles.pickDropRow}>
                        <ThemedText>Drop by</ThemedText>
                        <ThemedText type="defaultSemiBold">{row.dropTime}</ThemedText>
                      </View>
                    </View>
                  ))}
                </CardContent>
              </Card>
            </ScrollView>
          </TabsContent>
        </Tabs>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, paddingBottom: 0 },
  tabsRoot: { flex: 1 },
  tabsList: { marginBottom: 8 },
  tabContent: { flex: 1 },
  scrollBody: { gap: 12, paddingBottom: 36 },
  identityBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 20,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 2,
  },
  infoCard: {
    width: 240,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    gap: 6,
  },
  infoTitle: {
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 18,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    width: 16,
  },
  addressRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressTextArea: {
    gap: 8,
    flexShrink: 1,
  },
  addressText: {
    opacity: 0.85,
  },
  travelCard: {
    backgroundColor: '#ffe780',
  },
  travelMenu: {
    gap: 10,
  },
  travelRow: {
    borderRadius: 12,
    backgroundColor: '#fff4bf',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  travelRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineContent: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRail: {
    width: 16,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  timelineLine: {
    marginTop: 2,
    width: 2,
    flex: 1,
    minHeight: 40,
    backgroundColor: '#7e9fff',
  },
  timelineText: {
    gap: 4,
    flex: 1,
    paddingBottom: 12,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaCard: {
    backgroundColor: '#ffe780',
  },
  attendanceTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  etaContent: {
    gap: 10,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  etaTextBox: {
    gap: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekLabelBox: {
    alignItems: 'center',
    gap: 2,
  },
  weekNavBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
  },
  weekContent: {
    gap: 10,
  },
  showAllToggle: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  dayCardHighlight: {
    backgroundColor: '#fff8cc',
  },
  dayCardMuted: {
    backgroundColor: '#ffffff',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickDropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { fontSize: 14 },
});

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.length > 0 ? parts.map((part) => part.charAt(0).toUpperCase()).join('') : 'S';
}

function formatStopLabel(point: BusLocationPoint) {
  return `${Number(point.latitude).toFixed(4)}, ${Number(point.longitude).toFixed(4)}`;
}

function formatTimestamp(value: string | undefined) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function timelineProgress(points: BusLocationPoint[]) {
  if (points.length <= 1) return 0;
  return Math.min(100, Math.round((points.length / 7) * 100));
}

function TravelActionRow({
  icon,
  title,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} style={styles.travelRow} onPress={onPress}>
      <View style={styles.travelRowLeft}>
        {icon}
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </View>
      <ChevronRight color="#2b2b2b" size={18} />
    </Pressable>
  );
}

function getWeekRange(offset: number) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDateRange(start: Date, end: Date) {
  const from = start.toLocaleDateString([], { day: 'numeric', month: 'short' });
  const to = end.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${from} - ${to}`;
}

function buildAttendanceRows(events: AttendanceEvent[], start: Date) {
  const byDate = new Map<string, AttendanceEvent[]>();
  events.forEach((event) => {
    const value = String(event.timestamp ?? event.createdAt ?? '');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    const list = byDate.get(key) ?? [];
    list.push(event);
    byDate.set(key, list);
  });

  return Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    const key = date.toISOString().slice(0, 10);
    const list = (byDate.get(key) ?? []).sort((a, b) =>
      String(a.timestamp ?? a.createdAt ?? '').localeCompare(String(b.timestamp ?? b.createdAt ?? ''))
    );
    const pickup = list.find((event) => String(event.type).toLowerCase().includes('board'));
    const drop = [...list].reverse().find((event) => String(event.type).toLowerCase().includes('exit'));
    const today = new Date();
    const isToday =
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate();

    return {
      key,
      isToday,
      dayLabel: date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' }),
      pickupTime: formatTimestamp(String(pickup?.timestamp ?? pickup?.createdAt ?? '')),
      dropTime: formatTimestamp(String(drop?.timestamp ?? drop?.createdAt ?? '')),
    };
  });
}

