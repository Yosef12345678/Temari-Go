// Device API client for admin device provisioning & management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface Device {
  id: number;
  name: string;
  active: boolean;
  bus_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceListResponse {
  items: Device[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateDeviceInput {
  name: string;
  bus_id?: number | null;
}

function getHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}

export const deviceAPI = {
  async list(
    accessToken?: string,
    filters?: { active?: boolean; busId?: number; page?: number; pageSize?: number }
  ): Promise<DeviceListResponse> {
    const params = new URLSearchParams();
    if (filters?.active !== undefined) params.set("active", String(filters.active));
    if (filters?.busId !== undefined) params.set("busId", String(filters.busId));
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));

    const url = `${API_BASE_URL}/api/devices${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(accessToken),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch devices");
    }
    const result = await res.json();
    return result.data ?? result;
  },

  async create(input: CreateDeviceInput, accessToken?: string): Promise<{ device: Device; rawKey: string }> {
    const res = await fetch(`${API_BASE_URL}/api/devices`, {
      method: "POST",
      headers: getHeaders(accessToken),
      credentials: "include",
      body: JSON.stringify({
        name: input.name,
        bus_id: input.bus_id ?? undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create device");
    }
    const result = await res.json();
    return { device: (result.data ?? result) as Device, rawKey: result.rawKey as string };
  },

  async rotateKey(id: number, accessToken?: string): Promise<{ device: Device; rawKey: string }> {
    const res = await fetch(`${API_BASE_URL}/api/devices/${id}/rotate-key`, {
      method: "POST",
      headers: getHeaders(accessToken),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to rotate device key");
    }
    const result = await res.json();
    return { device: (result.data ?? result) as Device, rawKey: result.rawKey as string };
  },

  async setActive(id: number, active: boolean, accessToken?: string): Promise<Device> {
    const res = await fetch(`${API_BASE_URL}/api/devices/${id}/active`, {
      method: "PATCH",
      headers: getHeaders(accessToken),
      credentials: "include",
      body: JSON.stringify({ active }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update device");
    }
    const result = await res.json();
    return result.data ?? result;
  },

  async setBus(id: number, bus_id: number | null, accessToken?: string): Promise<Device> {
    const res = await fetch(`${API_BASE_URL}/api/devices/${id}/bus`, {
      method: "PATCH",
      headers: getHeaders(accessToken),
      credentials: "include",
      body: JSON.stringify({ bus_id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update bus binding");
    }
    const result = await res.json();
    return result.data ?? result;
  },
};

