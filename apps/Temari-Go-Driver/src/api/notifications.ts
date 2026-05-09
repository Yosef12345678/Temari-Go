import { request } from '@/api/http';
import { unwrapData, type ApiEnvelope } from '@/api/envelope';
import type { DriverNotification } from '@/types/notification';

export async function getNotifications() {
  const res = await request<ApiEnvelope<DriverNotification[]>>('GET', '/notifications', { auth: true });
  return unwrapData(res);
}

export async function markNotificationRead(id: number) {
  await request('PUT', `/notifications/${id}/read`, { auth: true });
}
