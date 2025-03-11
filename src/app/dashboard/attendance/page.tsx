'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@tremor/react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations } from '@/translations';
import { Attendance, ApiError } from '@/types';

export default function AttendancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);
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

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error(t.common.error);
        return;
      }

      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }

      setAttendanceHistory(attendanceData || []);
      
      // Find current attendance (no check_out time)
      const current = attendanceData?.find(a => !a.check_out);
      setCurrentAttendance(current || null);
      setIsCheckedIn(!!current);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error:', apiError);
      toast.error(apiError.message || t.common.error);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const handleAttendance = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error(t.common.error);
        return;
      }

      if (isCheckedIn && currentAttendance) {
        // Check out
        const { error } = await supabase
          .from('attendance')
          .update({
            check_out: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAttendance.id);

        if (error) throw error;
        toast.success(t.attendance.checkOut);
      } else {
        // Check in
        const { error } = await supabase
          .from('attendance')
          .insert({
            user_id: session.user.id,
            check_in: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success(t.attendance.checkIn);
      }

      await fetchAttendanceData();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error updating attendance:', apiError);
      toast.error(apiError.message || t.common.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold mb-2">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        <Button
          onClick={handleAttendance}
          isLoading={isLoading}
          className="w-full"
        >
          {isCheckedIn ? t.attendance.checkOut : t.attendance.checkIn}
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">{t.attendance.history}</h2>
        <div className="space-y-4">
          {attendanceHistory.map((record) => (
            <div
              key={record.id}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div>
                <div className="font-medium dark:text-white">
                  {format(new Date(record.check_in), 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(record.check_in), 'HH:mm')}
                  {record.check_out && (
                    <> - {format(new Date(record.check_out), 'HH:mm')}</>
                  )}
                </div>
              </div>
              <div className={`text-sm ${record.check_out ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {record.check_out ? t.attendance.completed : t.attendance.ongoing}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
