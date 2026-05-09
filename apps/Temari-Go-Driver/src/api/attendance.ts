import { unwrapData, type ApiEnvelope } from '@/api/envelope';
import { request } from '@/api/http';
import type { AttendanceSummary, DriverAbsence } from '@/types/attendance';

export async function getBusAttendance(busId: number): Promise<AttendanceSummary> {
  const res = await request<ApiEnvelope<AttendanceSummary>>('GET', `/attendance/bus/${busId}`, { auth: true });
  return unwrapData(res);
}

export async function manualAttendance(input: {
  student_id: number;
  bus_id: number;
  type?: 'boarding' | 'exiting';
  latitude?: number;
  longitude?: number;
}) {
  return await request('POST', '/attendance/manual', { auth: true, body: input });
}

export async function reportParentAbsence(input: {
  student_id: number;
  absence_date: string;
  reason?: string;
}) {
  return await request('POST', '/attendance/absence', { auth: true, body: input });
}

export async function getDriverAbsences(date?: string): Promise<DriverAbsence[]> {
  const res = await request<ApiEnvelope<DriverAbsence[]>>('GET', '/attendance/driver/absences', {
    auth: true,
    query: date ? { date } : undefined,
  });
  return unwrapData(res);
}
