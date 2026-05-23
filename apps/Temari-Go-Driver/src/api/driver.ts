import { unwrapData, type ApiEnvelope } from '@/api/envelope';
import { request } from '@/api/http';
import type {
  DriverJob,
  AlcoholCheckSession,
  AlcoholCheckView,
  DriverJobStatus,
} from '@/types/driver';
import type { UserMe } from '@/types/user';

export async function getMe(): Promise<UserMe> {
  const res = await request<ApiEnvelope<UserMe>>('GET', '/user/me', { auth: true });
  return unwrapData(res);
}

export async function getMyJobs(status?: DriverJobStatus | 'active' | 'pickup'): Promise<DriverJob[]> {
  const res = await request<ApiEnvelope<DriverJob[]>>('GET', '/driver/me/jobs', {
    auth: true,
    query: status ? { status } : undefined,
  });
  return unwrapData(res);
}

export async function getJob(jobId: number): Promise<DriverJob> {
  const res = await request<ApiEnvelope<DriverJob>>('GET', `/driver/jobs/${encodeURIComponent(String(jobId))}`, {
    auth: true,
  });
  return unwrapData(res);
}

export async function startAlcoholCheck(jobId: number): Promise<AlcoholCheckSession> {
  const res = await request<ApiEnvelope<AlcoholCheckSession>>(
    'POST',
    `/driver/jobs/${encodeURIComponent(String(jobId))}/alcohol-check`,
    { auth: true }
  );
  return unwrapData(res);
}

export async function getAlcoholCheck(jobId: number): Promise<AlcoholCheckView> {
  const res = await request<ApiEnvelope<AlcoholCheckView>>(
    'GET',
    `/driver/jobs/${encodeURIComponent(String(jobId))}/alcohol-check`,
    { auth: true }
  );
  return unwrapData(res);
}

async function transition(jobId: number, action: string, reason?: string): Promise<DriverJob> {
  const res = await request<ApiEnvelope<DriverJob>>(
    'POST',
    `/driver/jobs/${encodeURIComponent(String(jobId))}/${action}`,
    { auth: true, body: reason ? { reason } : undefined }
  );
  return unwrapData(res);
}

export async function acceptJob(jobId: number): Promise<DriverJob> {
  return await transition(jobId, 'accept');
}

export async function arriveJob(jobId: number): Promise<DriverJob> {
  return await transition(jobId, 'arrive');
}

export async function pickupJob(jobId: number): Promise<DriverJob> {
  return await transition(jobId, 'pickup');
}

export async function completeJob(jobId: number): Promise<DriverJob> {
  return await transition(jobId, 'complete');
}

export async function cancelJob(jobId: number, reason?: string): Promise<DriverJob> {
  return await transition(jobId, 'cancel', reason);
}
