import en from './en.json';
import ar from './ar.json';

export type TranslationType = {

  common: {
    dashboard: string;
    attendance: string;
    tasks: string;
    leaves: string;
    settings: string;
    logout: string;
    success: string;
    error: string;
    Leave_Requests : string;
    
  };
  settings: {
    title: string;
    appearance: string;
    manageAccount: string;
    language: string;
    profileSettings: string;
    fullName: string;
    email: string;
    role: string;
    updateProfile: string;
    theme: {
      light: string;
      dark: string;
      system: string;
    };
  };
  attendance: {
    title: string;
    checkIn: string;
    checkOut: string;
    history: string;
    checkedIn: string;
    checkedOut: string;
    completed: string;
    ongoing: string;
    date: string;
    time: string;
    status: string;
  };
  leaves: {
    title: string;
    newRequest: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
  };
};

export const translations: Record<'en' | 'ar', TranslationType> = {
  en,
  ar,
};

export type Language = keyof typeof translations;
