import { request } from '@/api/http';
import { unwrapData, type ApiEnvelope } from '@/api/envelope';
import type { AlcoholTestResult } from '@/types/safety';

export async function submitAlcoholTest(input: {
  bus_id: number;
  alcohol_level: number;
  latitude?: number;
  longitude?: number;
}) {
  const res = await request<ApiEnvelope<AlcoholTestResult>>('POST', '/alcohol-tests', {
    auth: true,
    body: input,
  });
  return unwrapData(res);
}

export async function triggerSOS(input: { latitude?: number; longitude?: number; reason?: string }) {
  return await request('POST', '/sos', { auth: true, body: input });
}
