export type DriverNotification = {
  id: number;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
};
