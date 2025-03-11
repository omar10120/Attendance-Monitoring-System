'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations } from '@/translations';

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  user_id: string;
  created_at: string;
  updated_at: string;
  expected_hours: number | null;
  profiles?: {
    full_name: string;
    email: string;
  };
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { language } = useLanguage();
  const t = translations[language];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'MEDIUM' as Task['priority'],
    user_id: '',
    expected_hours: 0,
    expected_minutes: 0
  });
  const router = useRouter();

  useEffect(() => {
    checkUserRole();
    fetchTasks();
    fetchEmployees();

    // Set up real-time subscription
    const channel = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchTasks(); // Refresh the tasks list when any change occurs
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setIsManager(profile?.role === 'MANAGER');
    } else {
      router.push('/login');
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'EMPLOYEE');
    
    if (data) setEmployees(data);
  };

  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // First get the user's role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const isUserManager = profile?.role === 'MANAGER';
      setIsManager(isUserManager);

      let query = supabase
        .from('tasks')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Only filter by user_id if not a manager
      if (!isUserManager) {
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Fetched tasks:', data); // Debug log
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error in fetchTasks:', error);
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const now = new Date().toISOString();
      const dueDate = new Date(formData.due_date);
      // Set the time to end of day (23:59:59)
      dueDate.setHours(23, 59, 59, 999);

      // Convert hours and minutes to decimal hours
      const totalHours = formData.expected_hours + (formData.expected_minutes / 60);

      let error;
      if (editingTask) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description,
            due_date: dueDate.toISOString(),
            priority: formData.priority,
            user_id: formData.user_id,
            expected_hours: totalHours > 0 ? Number(totalHours.toFixed(2)) : null,
            updated_at: now
          })
          .eq('id', editingTask.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tasks')
          .insert([{
            title: formData.title,
            description: formData.description,
            due_date: dueDate.toISOString(),
            status: 'PENDING',
            priority: formData.priority,
            user_id: formData.user_id,
            expected_hours: totalHours > 0 ? Number(totalHours.toFixed(2)) : null
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(editingTask ? 'Task updated successfully' : 'Task created successfully');
      setShowTaskForm(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'MEDIUM' as Task['priority'],
        user_id: '',
        expected_hours: 0,
        expected_minutes: 0
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: now
        })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
      toast.success('Task status updated');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
      toast.success('Task deleted successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50';
      case 'PENDING': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t.common.Leave_Requests}</h1>
          {isManager && (
            <Button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Task
            </Button>
          )}
        </div>

        {/* Task List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{task.profiles?.full_name}</div>
                      <div className="text-sm text-gray-500">{task.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(task.due_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.expected_hours ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {Math.floor(task.expected_hours)}h
                          {task.expected_hours % 1 > 0 && 
                            ` ${Math.round((task.expected_hours % 1) * 60)}m`
                          }
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Complete"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {isManager && (
                          <>
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setFormData({
                                  title: task.title,
                                  description: task.description,
                                  due_date: task.due_date,
                                  priority: task.priority,
                                  user_id: task.user_id,
                                  expected_hours: Math.floor(task.expected_hours || 0),
                                  expected_minutes: Math.round(((task.expected_hours || 0) % 1) * 60)
                                });
                                setShowTaskForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Form Modal */}
        <AnimatePresence>
          {showTaskForm && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                  </div>
                  <Input
                    label="Due Date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Time</label>
                    <div className="mt-1 flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Hours</label>
                        <input
                          type="number"
                          value={formData.expected_hours}
                          onChange={(e) => {
                            const hours = Math.min(Math.max(0, parseInt(e.target.value) || 0), 24);
                            setFormData(prev => ({ ...prev, expected_hours: hours }));
                          }}
                          min="0"
                          max="24"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                        <select
                          value={formData.expected_minutes}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, expected_minutes: parseInt(e.target.value) }));
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="0">0</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <select
                      name="user_id"
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowTaskForm(false);
                        setEditingTask(null);
                        setFormData({
                          title: '',
                          description: '',
                          due_date: '',
                          priority: 'MEDIUM' as Task['priority'],
                          user_id: '',
                          expected_hours: 0,
                          expected_minutes: 0
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}