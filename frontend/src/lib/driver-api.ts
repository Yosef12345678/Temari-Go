const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Driver {
  id: number;
  name: string;
  email: string;
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
};

