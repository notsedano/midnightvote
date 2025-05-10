import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Clean up subscription
    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile whenever user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // Special case handling for the known admin email
        if (user.email === 'contact.strodano@gmail.com') {
          console.log('Detected contact.strodano@gmail.com - special admin handling');
          setIsAdmin(true);
          setProfile({ ...user, is_admin: true });
          return;
        }
      } else {
        setProfile(data);
        
        // Special case handling for the known admin email, overriding the database value
        if (user.email === 'contact.strodano@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(data?.is_admin ?? false);
        }
        
        // Add debug logs to help diagnose admin issues
        console.log('Auth Context - Profile loaded:', {
          userId: user.id,
          email: user.email,
          isAdmin: user.email === 'contact.strodano@gmail.com' ? true : (data?.is_admin ?? false),
          profileData: data
        });
      }
    } catch (e) {
      console.error('Unexpected error in fetchProfile:', e);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      isAdmin,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);