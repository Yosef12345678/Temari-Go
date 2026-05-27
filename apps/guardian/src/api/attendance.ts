import { request } from '@/src/api/http';
import type { AttendanceEvent } from '@/src/types/attendance';
import type { ApiEnvelope } from '@/src/api/envelope';
import { unwrapData } from '@/src/api/envelope';

function normalizeAttendanceEvent(item: any): AttendanceEvent {
  return {
    ...item,
    id: String(item.id ?? item.event_id ?? item.eventId ?? ''),
    studentId: String(item.studentId ?? item.student_id ?? ''),
    busId: String(item.busId ?? item.bus_id ?? item.bus?.id ?? ''),
    timestamp: String(item.timestamp ?? item.createdAt ?? item.created_at ?? ''),
    busNumber: String(item.busNumber ?? item.bus_number ?? item.bus?.bus_number ?? ''),
    location: item.location ?? item.location_name ?? item.geofence?.name,
  };
}

export async function listAttendanceByStudent(
  studentId: string,
  query?: { startDate?: string; endDate?: string }
): Promise<AttendanceEvent[]> {
  const res = await request<ApiEnvelope<AttendanceEvent[] | { attendance?: AttendanceEvent[]; data?: AttendanceEvent[] }>>(
    'GET',
    `/attendance/student/${encodeURIComponent(studentId)}`,
    { auth: true, query }
  );
  const data = unwrapData(res);
  const rows = Array.isArray(data) ? data : data.attendance ?? data.data ?? [];
  return rows.map(normalizeAttendanceEvent);
}

export async function reportStudentAbsence(input: {
  student_id: number;
  absence_date: string;
  reason?: string;
}): Promise<unknown> {
  const res = await request<ApiEnvelope<unknown>>('POST', '/attendance/absence', {
    auth: true,
    body: input,
  });
  return unwrapData(res);
}

