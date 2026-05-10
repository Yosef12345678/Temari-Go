export type DriverJobStatus =
  | 'assigned'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export type DriverJobStudent = {
  id: number;
  full_name?: string;
  grade?: string;
};

export type DriverJobAssignment = {
  id: number;
  student_id: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_order?: number;
  student?: DriverJobStudent;
};

export type DriverJob = {
  id: number;
  route_id: number;
  bus_id: number;
  run_date: string;
  name: string;
  lifecycle_status: DriverJobStatus;
  start_time?: string;
  end_time?: string;
  accepted_at?: string | null;
  arrived_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  updated_at?: string;
  bus?: {
    id: number;
    bus_number: string;
  };
  routeRunAssignments?: DriverJobAssignment[];
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
  traffic_multiplier?: number;
};
