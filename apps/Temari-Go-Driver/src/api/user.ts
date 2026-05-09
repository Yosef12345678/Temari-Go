import { request } from '@/api/http';

export async function registerPushToken(fcmToken: string) {
  await request('POST', '/user/fcm-token', {
    auth: true,
    body: { fcmToken },
  });
}
