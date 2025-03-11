'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, Clock, Calendar, CheckSquare, Settings, Menu, GitPullRequest } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations } from '@/translations';

export function Sidebar() {
  const pathname = usePathname();
  const { language } = useLanguage();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const t = translations[language];

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        setIsManager(profile?.role !== 'MANAGER');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const baseNavigation = [
    { name: t.common.dashboard, href: '/dashboard', icon: Home },
    { name: t.common.attendance, href: '/dashboard/attendance', icon: Clock },
    { name: t.common.leaves, href: '/dashboard/leave', icon: Calendar },
    { name: t.common.Leave_Requests, href: '/dashboard/requests', icon: GitPullRequest },
    { name: t.common.tasks, href: '/dashboard/tasks', icon: CheckSquare },
    { name: t.common.settings, href: '/dashboard/settings', icon: Settings },
  ];

  const filteredNavigation = isManager
    ? baseNavigation.filter(item => item.name !== 'Leave Requests')
    : baseNavigation;

  return (
    <div 
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && <span className="text-lg font-semibold text-gray-800 dark:text-white">{t.common.Leave_Requests}</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <item.icon className={`h-5 w-5 mr-3 transition-colors ${
                  isActive 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed && <div className="text-xs text-gray-500 dark:text-gray-400">2025 EMS System</div>}
        </div>
      </div>
    </div>
  );
}
