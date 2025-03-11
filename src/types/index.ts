export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: 'EMPLOYEE' | 'MANAGER';
  department?: string | null;
  position?: string | null;
  email?: string | null;
  bio?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_to: string;
  created_by: string;
  expected_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface Leave {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  check_in: string;
  check_out?: string;
  created_at: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
