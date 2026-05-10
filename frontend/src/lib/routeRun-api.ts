// RouteRun API client for daily route execution instances
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

import type { Bus } from './bus-api';
import type { Student } from './student-api';

export type RouteRunStatus =
  | 'assigned'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export interface RouteRunAssignment {
  id: number;
  route_run_id: number;
  student_id: number;
  pickup_latitude?: number | string | null;
  pickup_longitude?: number | string | null;
  pickup_order?: number | null;
  student?: Pick<Student, 'id' | 'full_name' | 'grade'> | null;
}

export interface RouteRun {
  id: number;
  route_id: number;
  bus_id: number;
  run_date: string;
  name: string;
  start_time?: string | null;
  end_time?: string | null;
  lifecycle_status: RouteRunStatus;
  accepted_at?: string | null;
  arrived_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  updated_at?: string;
  bus?: Pick<Bus, 'id' | 'bus_number'> | null;
  routeRunAssignments?: RouteRunAssignment[];
  route_stops_eta?: {
    assignment_id: number;
    student_id: number;
    pickup_order?: number | null;
    eta_minutes: number;
    eta_at: string;
    student_name?: string | null;
    pickup_latitude?: number | null;
    pickup_longitude?: number | null;
  }[];
}

export interface CreateRouteRunInput {
  route_id: number;
  run_date: string;
  name?: string;
  start_time?: string | null;
  end_time?: string | null;
}

export interface RouteRunFilters {
  route_id?: number;
  bus_id?: number;
  run_date?: string;
  status?: RouteRunStatus | 'active';
}

function getHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

export const routeRunAPI = {
  async getAll(accessToken?: string, filters?: RouteRunFilters): Promise<RouteRun[]> {
    const params = new URLSearchParams();
    if (filters?.route_id) params.append('route_id', String(filters.route_id));
    if (filters?.bus_id) params.append('bus_id', String(filters.bus_id));
    if (filters?.run_date) params.append('run_date', filters.run_date);
    if (filters?.status) params.append('status', filters.status);

    const url = `${API_BASE_URL}/api/route-runs${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(accessToken),
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch route runs');
    }

    const result = await response.json();
    return result.data ?? result;
  },

  async getById(id: number, accessToken?: string): Promise<RouteRun> {
    const response = await fetch(`${API_BASE_URL}/api/route-runs/${id}`, {
      method: 'GET',
      headers: getHeaders(accessToken),
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch route run');
    }

    const result = await response.json();
    return result.data ?? result;
  },

  async create(input: CreateRouteRunInput, accessToken?: string): Promise<RouteRun> {
    const response = await fetch(`${API_BASE_URL}/api/route-runs`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify({
        route_id: input.route_id,
        run_date: input.run_date,
        name: input.name ?? undefined,
        start_time: input.start_time ?? undefined,
        end_time: input.end_time ?? undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create route run');
    }

    const result = await response.json();
    return result.data ?? result;
  },

  async delete(id: number, accessToken?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/route-runs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(accessToken),
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete route run');
    }
  },
};
