'use client';

import { useState, useEffect } from "react";
import { Card, Title, Text, Button } from "@tremor/react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations } from '@/translations';
interface Attendance {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  total_hours: number | null;
  status: 'present' | 'absent' | 'late';
  created_at: string;
  updated_at: string;
}

export default function AttendancePage() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { language } = useLanguage();
  const t = translations[language];
  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to access attendance');
        return;
      }

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttendanceHistory(data || []);
      
      // Find current attendance (no check_out time)
      const current = data?.find(a => !a.check_out);
      setCurrentAttendance(current || null);
      setIsCheckedIn(!!current);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    }
  };

  const handleCheckInOut = async () => {
    try {
      setIsLoading(true);
      console.log('Starting check in/out process...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to record attendance');
        return;
      }
      

      const now = new Date();
      const startOfWorkDay = new Date(now);
      startOfWorkDay.setHours(9, 0, 0, 0);

      if (!isCheckedIn) {
        
        // Check in
        const { data, error } = await supabase
          .from('attendance')
          .insert([{
            user_id: session.user.id,
            check_in: now.toISOString(),
            status: now > startOfWorkDay ? 'late' : 'present',
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          }])
          .select()
          .single();

        if (error) {
          
          throw error;
        }

        toast.success('Successfully checked in!');
      } else if (currentAttendance) {
        
        // Check out
        const checkInTime = new Date(currentAttendance.check_in);
        const totalHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

        const { data, error } = await supabase
          .from('attendance')
          .update({
            check_out: now.toISOString(),
            total_hours: Number(totalHours.toFixed(2)),
            updated_at: now.toISOString()
          })
          .eq('id', currentAttendance.id)
          .select()
          .single();

        if (error) {
          console.error('Check-out error:', error);
          throw error;
        }
        console.log('Check-out successful:', data);
        toast.success('Successfully checked out!');
      }

      await fetchAttendanceData();
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast.error(error.message || 'Failed to update attendance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{t.common.attendance}</h1>
        <div className="text-sm text-gray-600">
          {format(currentTime, "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      <Card className="max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <Title>Time Clock</Title>
            <Text>Track your working hours</Text>
          </div>
          <Clock className="w-8 h-8 text-blue-500" />
        </div>

        <div className="mt-6 text-center">
          <div className="text-4xl font-bold text-gray-900">
            {format(currentTime, "hh:mm:ss a")}
          </div>
          {currentAttendance?.check_in && (
            <Text className="mt-2">
              Checked in at: {format(new Date(currentAttendance.check_in), "hh:mm a")}
            </Text>
          )}
        </div>

        <Button
          className="mt-6 w-full"
          color={isCheckedIn ? "red" : "blue"}
          onClick={handleCheckInOut}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : isCheckedIn ? "Check Out" : "Check In"}
        </Button>
      </Card>

      <Card>
        <Title>Attendance History</Title>
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceHistory.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(record.check_in), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(record.check_in), "hh:mm a")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.check_out ? format(new Date(record.check_out), "hh:mm a") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.total_hours?.toFixed(2) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
