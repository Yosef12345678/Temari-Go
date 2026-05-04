import Constants from 'expo-constants';
import { Platform } from 'react-native';

import * as usersApi from '@/src/api/users';

let hasAttemptedThisBoot = false;

function notificationsAccessAllowed(perms: unknown): boolean {
  const p = perms as { status?: string; granted?: boolean };
  if (typeof p.status === 'string') return p.status === 'granted';
  return p.granted === true;
}

async function getBestEffortPushToken(): Promise<string | null> {
  // Dynamic import: loading `expo-notifications` in Expo Go throws at module eval time.
  const Notifications = await import('expo-notifications');

  const perms = await Notifications.getPermissionsAsync();
  if (!notificationsAccessAllowed(perms)) {
    const req = await Notifications.requestPermissionsAsync();
    if (!notificationsAccessAllowed(req)) return null;
  }

  try {
    if (Platform.OS === 'android') {
      const device = await Notifications.getDevicePushTokenAsync();
      if (device.data) return String(device.data);
    }
  } catch {
    // ignore; fall back
  }

  try {
    const expoToken = await Notifications.getExpoPushTokenAsync();
    return expoToken.data;
  } catch {
    return null;
  }
}

/**
 * Best-effort push token registration. Safe to call multiple times; only runs once per app boot.
 * Skips entirely in Expo Go (remote push is not supported there).
 */
export async function registerPushTokenOncePerBoot(): Promise<void> {
  if (hasAttemptedThisBoot) return;
  hasAttemptedThisBoot = true;

  if (Constants.appOwnership === 'expo') {
    return;
  }

  const token = await getBestEffortPushToken();
  if (!token) return;

  try {
    await usersApi.registerFcmToken({ fcmToken: token });
  } catch {
    // ignore; do not break app startup
  }
}
