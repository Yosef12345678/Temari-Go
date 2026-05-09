import Constants from 'expo-constants';

type Env = {
  API_BASE_URL: string;
};

function readApiBaseUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.API_BASE_URL;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();
  return 'http://localhost:4000';
}

export const env: Env = {
  API_BASE_URL: readApiBaseUrl(),
};
