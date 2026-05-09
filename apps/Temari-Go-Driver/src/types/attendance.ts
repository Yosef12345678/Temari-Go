export type AttendanceStudent = {
  id: number;
  full_name: string;
  grade?: string;
  boarded: boolean;
  absent?: boolean;
};

export type AttendanceSummary = {
  bus: { id: number; bus_number: string };
  date: string;
  statistics: {
    totalAssignedStudents: number;
    currentOnboardCount: number;
    missedPickupCount: number;
    reportedAbsentCount?: number;
  };
  expectedStudents: AttendanceStudent[];
  onboardStudents: { id: number; full_name: string; grade?: string }[];
  attendances: {
    id: number;
    student_id: number;
    type: 'boarding' | 'exiting';
    timestamp: string;
    manual_override: boolean;
  }[];
};

export type DriverAbsence = {
  id: number;
  student_id: number;
  student_name: string | null;
  grade?: string | null;
  bus_id: number | null;
  absence_date: string;
  reason?: string | null;
  status: 'reported' | 'acknowledged';
};
