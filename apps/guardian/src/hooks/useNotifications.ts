import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as notificationsApi from '@/src/api/notifications';
import type { NotificationItem, NotificationListResponse } from '@/src/types/notification';

import { queryKeys } from './queryKeys';

export function useNotifications(filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
  read?: boolean | 0 | 1 | 'true' | 'false';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.notifications(filters),
    queryFn: () => notificationsApi.listNotifications(filters),
  });
}

function markNotificationReadInCache(
  value: unknown,
  id: string
): NotificationListResponse | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const response = value as NotificationListResponse;
  if (!response?.data || !Array.isArray(response.data)) return undefined;

  return {
    ...response,
    data: response.data.map((item) =>
      String(item.id) === String(id) ? { ...item, read: true } : item
    ),
  };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });

      const previousQueries = qc.getQueriesData({ queryKey: ['notifications'] });

      previousQueries.forEach(([key, value]) => {
        const nextValue = markNotificationReadInCache(value, id);
        if (nextValue) qc.setQueryData(key, nextValue);
      });

      return { previousQueries };
    },
    onError: (_error, _id, context) => {
      context?.previousQueries?.forEach(([key, value]) => {
        qc.setQueryData(key, value);
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

