export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'EMPLOYEE' | 'MANAGER';
  department?: string | null;
  position?: string | null;
  email?: string | null;
  bio?: string | null;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in: Date;
  check_out?: Date | null;
  total_hours?: number | null;
  status: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  type: 'FULL_DAY' | 'HOURLY';
  start_date: Date;
  end_date: Date;
  hours?: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  user_id: string;
}
