'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import {
  Clock,
  Calendar,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  totalHours: number;
  leaveBalance: number;
  tasksCompleted: number;
  attendanceRate: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalHours: 0,
    leaveBalance: 20,
    tasksCompleted: 0,
    attendanceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }

          // Fetch attendance stats
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('total_hours')
            .eq('user_id', session.user.id);

          // Fetch tasks stats
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('status')
            .eq('user_id', session.user.id);

          // Calculate stats
          const totalHours = attendanceData?.reduce((acc, curr) => acc + (curr.total_hours || 0), 0) || 0;
          const completedTasks = tasksData?.filter(task => task.status === 'COMPLETED').length || 0;
          const attendanceRate = attendanceData ? (attendanceData.length / 20) * 100 : 0;

          setStats({
            totalHours,
            leaveBalance: 20,
            tasksCompleted: completedTasks,
            attendanceRate,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {profile?.full_name}
        </h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalHours ? stats.totalHours.toFixed(2) : "-"}h</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Leave Balance</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.leaveBalance} days</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Calendar className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.tasksCompleted}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <CheckSquare className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.attendanceRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {/* Add recent activity items here */}
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
          <div className="space-y-4">
            {/* Add upcoming tasks here */}
            <p className="text-sm text-gray-500">No upcoming tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
