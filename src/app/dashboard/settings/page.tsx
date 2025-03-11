'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Globe2, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations } from '@/translations';
import { UserProfile } from '@/types';

const themes = [
  { id: 'light', name: { en: 'Light', ar: 'فاتح' }, icon: Sun },
  { id: 'dark', name: { en: 'Dark', ar: 'داكن' }, icon: Moon },
  { id: 'system', name: { en: 'System', ar: 'النظام' }, icon: Monitor },
];

const languages = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError('');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const t = translations[language];

  return (
    <div className="space-y-8" >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.settings.appearance}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {/* {t.settings.manageAccount} */}
          </p>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t.settings.appearance}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`
                  flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all
                  ${theme === id 
                    ? 'border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{name[language]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <Globe2 className="w-5 h-5" />
            <span>{t.settings.language}</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {languages.map(({ id, name, nativeName }) => (
              <button
                key={id}
                onClick={() => setLanguage(id as 'en' | 'ar')}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center
                  ${language === id 
                    ? 'border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400'
                  }
                `}
              >
                <div className="dark:text-white">{nativeName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        {profile && (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{t.settings.profileSettings}</span>
            </h3>
            
            <div className="space-y-4">
              <Input
                label={t.settings.fullName}
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                error={error}
              />

              <Input
                label={t.settings.email}
                value={profile.email || ''}
                disabled
              />

              <Input
                label={t.settings.profileSettings}
                value={profile.role || ''}
                disabled
              />

              <Button
                onClick={handleSaveProfile}
                isLoading={isSaving}
                className="w-full sm:w-auto"
              >
                {t.settings.updateProfile}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
