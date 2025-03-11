'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations } from '@/translations';

type LeaveType = 'FULL_DAY' | 'HOURLY' | 'ONE_DAY';

interface LeaveRequest {
  id: string;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string | null;
  hours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  type: LeaveType;
  start_date: string;
  end_date: string | null;
  hours: number;
  reason: string;
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [formData, setFormData] = useState<FormData>({
    type: 'FULL_DAY' as LeaveType,
    start_date: '',
    end_date: '',
    hours: 8,
    reason: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [totalDays, setTotalDays] = useState(0);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const { language } = useLanguage();
  const t = translations[language];
  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays);
    }
  }, [formData.start_date, formData.end_date]);

  const fetchLeaveRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If type changes to ONE_DAY, reset end_date
    if (name === 'type' && value === 'ONE_DAY') {
      setFormData(prev => ({
        ...prev,
        [name]: value as LeaveType,
        end_date: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // For ONE_DAY type, set end_date to null
      const submitData = {
        ...formData,
        end_date: formData.type === 'ONE_DAY' ? null : formData.end_date,
        user_id: session.user.id,
        status: 'PENDING'
      };

      const { error } = await supabase
        .from('leave_requests')
        .insert([submitData]);

      if (error) throw error;

      toast.success('Leave request submitted successfully');
      setFormData({
        type: 'FULL_DAY' as LeaveType,
        start_date: '',
        end_date: '',
        hours: 8,
        reason: ''
      });
      fetchLeaveRequests();
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.common.Leave_Requests}</h1>

        {/* Leave Request Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Submit New Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Leave Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="HOURLY">Hourly</option>
                <option value="ONE_DAY">One Day</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
              </div>
              {formData.type !== 'ONE_DAY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    min={formData.start_date}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    // required={formData.type !== 'ONE_DAY'}
                  />
                </div>
              )}
            </div>

            {formData.type !== 'ONE_DAY' && totalDays > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Total Leave Duration:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {totalDays} {totalDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            )}

            <Input
              label="Hours per Day"
              name="hours"
              type="number"
              value={formData.hours}
              onChange={handleInputChange}
              required
              min={1}
              max={24}
              disabled={formData.type === 'FULL_DAY'}
              className={formData.type === 'FULL_DAY' ? 'bg-gray-100' : ''}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Please provide a reason for your leave request..."
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Submit Request
            </Button>
          </form>
        </div>

        {/* Leave Requests History */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Request History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Start Date</th>
                  <th className="px-4 py-2 text-left">End Date</th>
                  <th className="px-4 py-2 text-left">Hours</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{request.type}</td>
                    <td className="px-4 py-2">{format(new Date(request.start_date), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="px-4 py-2">{request.end_date ? format(new Date(request.end_date), 'MMM dd, yyyy HH:mm') : '-'}</td>
                    <td className="px-4 py-2">{request.hours}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                        {request.status === 'REJECTED' && request.rejection_reason && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectionDialog(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            title="View rejection reason"
                          >
                            <InformationCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setSelectedReason(request.reason)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="View Reason"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                      No leave requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reason Dialog */}
        <AnimatePresence>
          {selectedReason && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4"
              >
                <h3 className="text-lg font-semibold mb-2">Leave Request Reason</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedReason}</p>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReason(null)}
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Rejection Reason Dialog */}
        {showRejectionDialog && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Rejected</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Request Reason:
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
                  {selectedRequest.reason}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager's Rejection Reason:
                </label>
                <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  {selectedRequest.rejection_reason}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
