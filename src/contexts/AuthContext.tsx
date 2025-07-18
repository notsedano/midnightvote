import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, ipAddress?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateUserIp: (userId: string, ipAddress: string) => Promise<void>;
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
  updateUserIp: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Retry function for getting the initial session
    const getInitialSession = async () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error(`Failed to get initial session (attempt ${attempts + 1}/${maxAttempts}):`, error);
          attempts++;
          
          // If this is the last attempt, set loading to false
          if (attempts >= maxAttempts) {
            setIsLoading(false);
            console.warn('All attempts to get initial session failed');
          } else {
            // Otherwise wait before retrying
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      }
    };
    
    // Get initial session with retry
    getInitialSession();

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

  // Update user's IP address
  const updateUserIp = async (userId: string, ipAddress: string) => {
    if (!userId || !ipAddress) return;
    
    try {
      // Check if we have a profiles_ip table
      const { error: checkError } = await supabase
        .from('profiles_ip')
        .select('id')
        .limit(1);
        
      if (checkError) {
        // If the table doesn't exist, try updating the profiles metadata instead
        console.log('profiles_ip table not found, trying metadata update');
        const { error } = await supabase
          .from('profiles')
          .update({ metadata: { ip_address: ipAddress, last_login: new Date().toISOString() } })
          .eq('id', userId);
          
        if (error) console.error('Error updating profile metadata:', error);
      } else {
        // If the table exists, upsert the IP record
        const { error } = await supabase
          .from('profiles_ip')
          .upsert({ 
            user_id: userId, 
            ip_address: ipAddress, 
            last_login: new Date().toISOString() 
          });
          
        if (error) console.error('Error updating profiles_ip:', error);
      }
    } catch (e) {
      console.error('Error in updateUserIp:', e);
    }
  };

  const signIn = async (email: string, password: string, ipAddress?: string) => {
    // Implement retry logic for authentication
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`Sign-in attempt ${attempt}/${maxRetries}`);
          // Add a small delay between retries
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Try login with Supabase
        const result = await supabase.auth.signInWithPassword({ email, password });
        
        if (result.error) {
          console.error(`Sign-in error on attempt ${attempt}:`, result.error);
          lastError = result.error;
          
          // If not the last attempt, continue to next retry
          if (attempt < maxRetries) continue;
        } else {
          // Login successful - update IP if provided
          if (result.data.user && ipAddress) {
            await updateUserIp(result.data.user.id, ipAddress);
          }
          
          // Return success
          return { error: null };
        }
      } catch (err) {
        console.error(`Exception on sign-in attempt ${attempt}:`, err);
        lastError = err;
        
        // If not the last attempt, continue to next retry
        if (attempt < maxRetries) continue;
      }
    }
    
    // If we got here, all attempts failed
    console.error('All sign-in attempts failed');
    return { error: lastError };
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
      updateUserIp,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);