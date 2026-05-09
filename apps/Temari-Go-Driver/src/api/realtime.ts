import NetInfo from '@react-native-community/netinfo';
import EventSource from 'react-native-sse';

import { constants } from '@/config/constants';
import { env } from '@/config/env';
import { getAccessToken } from '@/api/tokenStore';

export type SyncStatus = 'online' | 'offline' | 'degraded';

export type RealtimeSnapshot = {
  status: SyncStatus;
  jobsCount: number;
  unreadCount: number;
  updatedAt: string;
};

export type RealtimeEventFrame = {
  event: string;
  ts: string;
  payload: Record<string, unknown>;
};

export function subscribeRealtime(
  onUpdate: (snapshot: RealtimeSnapshot) => void,
  onEvent?: (event: RealtimeEventFrame) => void,
  onError?: (error: unknown) => void
): () => void {
  const token = getAccessToken();
  let closed = false;
  let unreadCount = 0;
  let jobsCount = 0;
  const url = `${env.API_BASE_URL}${constants.api.basePath}/realtime/stream`;

  const source = new EventSource(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const emit = (status: SyncStatus) =>
    onUpdate({ status, jobsCount, unreadCount, updatedAt: new Date().toISOString() });

  const netUnsub = NetInfo.addEventListener((state) => {
    if (!state.isConnected) emit('offline');
  });

  source.addEventListener('open', () => emit('online'));
  source.addEventListener('error', (event) => {
    emit('degraded');
    onError?.(event);
  });
  source.addEventListener('message', (event: any) => {
    try {
      const frame = JSON.parse(event.data) as RealtimeEventFrame;
      if (frame.event === 'notification.created' && frame.payload?.userId) {
        unreadCount += 1;
      }
      if (frame.event === 'driver.job.updated') {
        jobsCount = Math.max(1, jobsCount);
      }
      onEvent?.(frame);
      emit('online');
    } catch {
      emit('degraded');
    }
  });

  return () => {
    if (closed) return;
    closed = true;
    netUnsub();
    source.close();
  };
}
