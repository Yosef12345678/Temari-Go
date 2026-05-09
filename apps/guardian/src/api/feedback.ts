import { request } from '@/src/api/http';
import type { CanRateDriverResponse, DriverFeedbackRequest, DriverFeedbackResponse } from '@/src/types/feedback';
import type { ApiEnvelope } from '@/src/api/envelope';
import { unwrapData } from '@/src/api/envelope';

export async function createDriverFeedback(body: DriverFeedbackRequest): Promise<DriverFeedbackResponse> {
  const res = await request<ApiEnvelope<DriverFeedbackResponse>>('POST', '/driver-feedback', { auth: true, body });
  return unwrapData(res);
}

export async function canRateDriver(driverId: string): Promise<CanRateDriverResponse> {
  const res = await request<ApiEnvelope<CanRateDriverResponse>>(
    'GET',
    `/driver-feedback/can-rate/${encodeURIComponent(driverId)}`,
    { auth: true }
  );
  return unwrapData(res);
}

