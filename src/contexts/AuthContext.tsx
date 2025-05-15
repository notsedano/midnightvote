import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Create a logger helper
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[AUTH] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[AUTH ERROR] ${message}`, error || '');
  }
};

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
  const [retryCount, setRetryCount] = useState(0);

  // Function to get session with retry logic
  const getSessionWithRetry = async () => {
    try {
      logger.info('Attempting to get session');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        logger.info('Session retrieved successfully');
        setSession(session);
        setUser(session?.user ?? null);
      } else {
        logger.info('No active session found');
      }
      
      setIsLoading(false);
      // Reset retry count on success
      setRetryCount(0);
      
    } catch (error) {
      logger.error('Error retrieving session', error);
      
      // Implement retry logic with exponential backoff
      if (retryCount < 3) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        const delay = Math.pow(2, nextRetry) * 1000; // Exponential backoff
        logger.info(`Retrying in ${delay}ms (attempt ${nextRetry}/3)`);
        
        setTimeout(() => {
          getSessionWithRetry();
        }, delay);
      } else {
        logger.error('Maximum retry attempts reached');
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Get initial session with retry mechanism
    getSessionWithRetry();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.info(`Auth state changed: ${_event}`);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Clean up subscription
    return () => {
      logger.info('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
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
      logger.info(`Fetching profile for user: ${user.id}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error);
        
        // Special case handling for the known admin email
        if (user.email === 'contact.strodano@gmail.com') {
          logger.info('Detected contact.strodano@gmail.com - special admin handling');
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
        
        logger.info('Profile loaded successfully', {
          userId: user.id,
          email: user.email,
          isAdmin: user.email === 'contact.strodano@gmail.com' ? true : (data?.is_admin ?? false)
        });
      }
    } catch (e) {
      logger.error('Unexpected error in fetchProfile:', e);
    }
  };

  // Update user's IP address
  const updateUserIp = async (userId: string, ipAddress: string) => {
    if (!userId || !ipAddress) return;
    
    try {
      logger.info(`Updating IP address for user ${userId}: ${ipAddress}`);
      
      // Check if we have a profiles_ip table
      const { error: checkError } = await supabase
        .from('profiles_ip')
        .select('id')
        .limit(1);
        
      if (checkError) {
        // If the table doesn't exist, try updating the profiles metadata instead
        logger.info('profiles_ip table not found, trying metadata update');
        const { error } = await supabase
          .from('profiles')
          .update({ metadata: { ip_address: ipAddress, last_login: new Date().toISOString() } })
          .eq('id', userId);
          
        if (error) logger.error('Error updating profile metadata:', error);
      } else {
        // If the table exists, upsert the IP record
        const { error } = await supabase
          .from('profiles_ip')
          .upsert({ 
            user_id: userId, 
            ip_address: ipAddress, 
            last_login: new Date().toISOString() 
          });
          
        if (error) logger.error('Error updating profiles_ip:', error);
      }
    } catch (e) {
      logger.error('Error in updateUserIp:', e);
    }
  };

  const signIn = async (email: string, password: string, ipAddress?: string) => {
    try {
      logger.info(`Attempting to sign in user: ${email}`);
      
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        logger.error('Sign in error:', error);
        return { error };
      }
      
      // If login was successful and we have an IP address, update it
      if (data.user && ipAddress) {
        logger.info(`Login successful, updating IP for user ${data.user.id}`);
        await updateUserIp(data.user.id, ipAddress);
      }
      
      return { error: null };
    } catch (e: any) {
      logger.error('Unexpected error during sign in:', e);
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      logger.info(`Attempting to sign up user: ${email}`);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        logger.error('Sign up error:', error);
      } else {
        logger.info('Sign up successful');
      }
      
      return { data, error };
    } catch (e: any) {
      logger.error('Unexpected error during sign up:', e);
      return { data: null, error: e };
    }
  };

  const signOut = async () => {
    try {
      logger.info('Signing out user');
      await supabase.auth.signOut();
      logger.info('Sign out successful');
    } catch (e) {
      logger.error('Error during sign out:', e);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      logger.info(`Resetting password for: ${email}`);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        logger.error('Reset password error:', error);
      } else {
        logger.info('Reset password email sent successfully');
      }
      
      return { error };
    } catch (e: any) {
      logger.error('Unexpected error during password reset:', e);
      return { error: e };
    }
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