import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function getSession() {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')  
      .eq('user_id', session.user.id)
      .single();

    return {
      ...session,
      user: {
        ...session.user,
        ...profile,
      },
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
