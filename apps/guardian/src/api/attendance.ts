import { request } from '@/src/api/http';
import type { AttendanceEvent } from '@/src/types/attendance';
import type { ApiEnvelope } from '@/src/api/envelope';
import { unwrapData } from '@/src/api/envelope';

export async function listAttendanceByStudent(
  studentId: string,
  query?: { startDate?: string; endDate?: string }
): Promise<AttendanceEvent[]> {
  const res = await request<ApiEnvelope<AttendanceEvent[]>>(
    'GET',
    `/attendance/student/${encodeURIComponent(studentId)}`,
    { auth: true, query }
  );
  return unwrapData(res);
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

