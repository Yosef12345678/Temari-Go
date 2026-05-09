import { unwrapData, type ApiEnvelope } from '@/api/envelope';
import { request } from '@/api/http';
import type { BusCurrentLocation, BusLocationPoint } from '@/types/location';

export async function getBusCurrent(busId: number | string): Promise<BusCurrentLocation> {
  const res = await request<ApiEnvelope<BusCurrentLocation>>(
    'GET',
    `/locations/bus/${encodeURIComponent(String(busId))}/current`,
    {
      auth: true,
    }
  );
  return unwrapData(res);
}

export async function getBusHistory(
  busId: number | string,
  query?: { startDate?: string; endDate?: string; limit?: number }
): Promise<BusLocationPoint[]> {
  const res = await request<ApiEnvelope<BusLocationPoint[]>>(
    'GET',
    `/locations/bus/${encodeURIComponent(String(busId))}/history`,
    {
      auth: true,
      query,
    }
  );
  return unwrapData(res);
}
