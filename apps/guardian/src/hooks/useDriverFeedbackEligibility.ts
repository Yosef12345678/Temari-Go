import { useQuery } from '@tanstack/react-query';

import * as feedbackApi from '@/src/api/feedback';
import { queryKeys } from '@/src/hooks/queryKeys';

export function useCanRateDriver(driverId: string | null | undefined) {
  return useQuery({
    enabled: Boolean(driverId),
    queryKey: queryKeys.driverFeedbackEligibility(String(driverId ?? '')),
    queryFn: () => feedbackApi.canRateDriver(String(driverId)),
    staleTime: 30_000,
  });
}

