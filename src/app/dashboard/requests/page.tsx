'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations } from '@/translations';
type LeaveRequest = {
  id: string;
  user_id: string;
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  rejection_reason?: string;
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    checkManagerRole();
    fetchAllRequests();
  }, []);

  const checkManagerRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'MANAGER') {
      router.push('/dashboard');
      toast.error('Only managers can access this page');
    }
  };

  const fetchAllRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (request: LeaveRequest, newStatus: 'APPROVED' | 'REJECTED') => {
    if (newStatus === 'REJECTED') {
      setSelectedRequest(request);
      setRejectionReason(''); // Reset rejection reason
      setShowRejectionDialog(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: newStatus })
        .eq('id', request.id);

      if (error) throw error;
      
      toast.success(`Leave request ${newStatus.toLowerCase()}`);
      fetchAllRequests();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'REJECTED',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;
      
      toast.success('Leave request rejected');
      setShowRejectionDialog(false);
      setSelectedRequest(null);
      fetchAllRequests();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateDays = (request: LeaveRequest) => {
    if (request.type === 'ONE_DAY') {
      return 1;
    }
    
    const start = new Date(request.start_date);
    const end = new Date(request.end_date || request.start_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title.leave_request_title}</h1>

        {/* Requests Table */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Employee</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Start Date</th>
                  <th className="px-4 py-2 text-left">End Date</th>
                  <th className="px-4 py-2 text-left">Total Days</th>
                  <th className="px-4 py-2 text-left">Hours</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{request.profiles?.full_name}</div>
                        <div className="text-sm text-gray-500">{request.profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">{request.type}</td>
                    <td className="px-4 py-2">{format(new Date(request.start_date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-2">{format(new Date(request.end_date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {calculateDays(request)} {calculateDays(request) === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{request.hours}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status}
                        </span>
                        {request.status === 'REJECTED' && request.rejection_reason && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectionReason(request.rejection_reason || '');
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
                      <div className="flex items-center gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              aria-setsizee="sm"
                              onClick={() => handleStatusChange(request, 'APPROVED')}
                              disabled={isLoading}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              aria-setsizee="sm"
                              onClick={() => handleStatusChange(request, 'REJECTED')}
                              disabled={isLoading}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedReason(request.reason)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="View Reason"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
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
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
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

        {showRejectionDialog && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejection Reason</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee's Request Reason:
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
                  {selectedRequest.reason}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
