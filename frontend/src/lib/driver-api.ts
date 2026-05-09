const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Driver {
  id: number;
  name: string;
  email: string;
}

export interface DriverApplication {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  username?: string | null;
  account_status: 'pending_verification' | 'active' | 'rejected' | 'suspended';
  created_at?: string;
  verified_at?: string | null;
  rejected_reason?: string | null;
}

export type DriverJobStatus =
  | 'assigned'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

function getHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

export const driverAPI = {
  async getAll(accessToken?: string): Promise<Driver[]> {
    const response = await fetch(`${API_BASE_URL}/api/user/drivers`, {
      method: 'GET',
      headers: getHeaders(accessToken),
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch drivers');
    }

    const result = await response.json();
    return result.data ?? result;
  },

  async updateJobStatus(
    jobId: number,
    action: 'accept' | 'arrive' | 'pickup' | 'complete' | 'cancel',
    input: { driver_id: number; reason?: string },
    accessToken?: string
  ): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/api/driver/jobs/${jobId}/${action}`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update job status');
    }

    const result = await response.json();
    return result.data ?? result;
  },

  async listApplications(
    status: 'pending_verification' | 'rejected' | 'active' = 'pending_verification',
    accessToken?: string
  ): Promise<DriverApplication[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/admin/driver-applications?status=${encodeURIComponent(status)}`,
      {
        method: 'GET',
        headers: getHeaders(accessToken),
        credentials: 'include',
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch driver applications');
    }
    const result = await response.json();
    return result.data ?? result;
  },

  async approveApplication(userId: number, accessToken?: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/driver-applications/${userId}/approve`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      credentials: 'include',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to approve driver application');
    }
    const result = await response.json();
    return result.data ?? result;
  },

  async rejectApplication(userId: number, reason?: string, accessToken?: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/driver-applications/${userId}/reject`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reject driver application');
    }
    const result = await response.json();
    return result.data ?? result;
  },
};

