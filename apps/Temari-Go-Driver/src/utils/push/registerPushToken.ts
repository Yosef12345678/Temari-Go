import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerPushToken } from '@/api/user';

let hasAttemptedThisBoot = false;

function notificationsAccessAllowed(perms: unknown): boolean {
  const p = perms as { status?: string; granted?: boolean };
  if (typeof p.status === 'string') return p.status === 'granted';
  return p.granted === true;
}

async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await import('expo-notifications');
  const perms = await Notifications.getPermissionsAsync();
  if (!notificationsAccessAllowed(perms)) {
    const req = await Notifications.requestPermissionsAsync();
    if (!notificationsAccessAllowed(req)) return false;
  }
  return true;
}

async function getBestEffortPushToken(): Promise<string | null> {
  const Notifications = await import('expo-notifications');
  const allowed = await ensureNotificationPermission();
  if (!allowed) return null;

  try {
    if (Platform.OS === 'android') {
      const device = await Notifications.getDevicePushTokenAsync();
      if (device.data) return String(device.data);
    }
  } catch {}

  try {
    const expoToken = await Notifications.getExpoPushTokenAsync();
    return expoToken.data;
  } catch {
    return null;
  }
}

export async function registerPushTokenOncePerBoot(): Promise<void> {
  if (hasAttemptedThisBoot) return;
  hasAttemptedThisBoot = true;

  try {
    const allowed = await ensureNotificationPermission();
    if (!allowed) return;
  } catch {
    return;
  }

  if (Constants.appOwnership === 'expo') return;

  const token = await getBestEffortPushToken();
  if (!token) return;
  try {
    await registerPushToken(token);
  } catch {}
}
