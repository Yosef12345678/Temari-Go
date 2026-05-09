import Constants from 'expo-constants';

type Env = {
  API_BASE_URL: string;
  GOOGLE_MAPS_WEB_URL: string;
};

function readApiBaseUrl(): string {
  // Expo injects EXPO_PUBLIC_* into JS at build/runtime.
  if (typeof process.env.EXPO_PUBLIC_API_BASE_URL === 'string' && process.env.EXPO_PUBLIC_API_BASE_URL.trim()) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.trim();
  }
  const fromExtra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.API_BASE_URL;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();
  return 'http://localhost:4000';
}

function readGoogleMapsWebUrl(): string {
  if (
    typeof process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_URL === 'string' &&
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_URL.trim()
  ) {
    return process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_URL.trim();
  }
  const fromExtra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.GOOGLE_MAPS_WEB_URL;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();
  return 'https://maps.google.com';
}

export const env: Env = {
  API_BASE_URL: readApiBaseUrl(),
  GOOGLE_MAPS_WEB_URL: readGoogleMapsWebUrl(),
};
