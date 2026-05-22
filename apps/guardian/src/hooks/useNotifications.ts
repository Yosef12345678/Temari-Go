import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as notificationsApi from '@/src/api/notifications';

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

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });

      const previousQueries = qc.getQueriesData({ queryKey: ['notifications'] });

      previousQueries.forEach(([key, value]) => {
        if (!value || typeof value !== 'object' || !('data' in value) || !Array.isArray((value as any).data)) {
          return;
        }

        qc.setQueryData(key, {
          ...(value as Record<string, unknown>),
          data: (value as any).data.map((item: Record<string, unknown>) =>
            String(item.id ?? '') === id ? { ...item, read: true } : item
          ),
        });
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

