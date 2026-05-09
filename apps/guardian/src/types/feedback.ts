export type DriverFeedbackRequest = {
  driver_id: string;
  rating: number; // 1-5
  comment?: string;
  /**
   * Deprecated: backend derives parent from auth session.
   * Kept optional for backwards compatibility.
   */
  parent_id?: string;
};

export type DriverFeedbackResponse = {
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type CanRateDriverResponse = {
  canRate: boolean;
  lastRatedAt: string | null;
  nextEligibleAt: string | null;
};

