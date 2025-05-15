import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get the base URL for the current environment
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser - use current origin
    return window.location.origin;
  }
  // SSR - use a default URL
  return 'http://localhost:3000';
};

// Add debug logging
console.log("Supabase initialization:", { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase connection');
}

// Use proxy URL for Supabase to avoid CORS issues
const useProxyUrl = true; // Set to false to use direct Supabase URL

// Create client with the proxy URL when in production
export const supabase = createClient<Database>(
  // For production, use our proxy endpoint
  useProxyUrl 
    ? `${getBaseUrl()}/api/supabase`
    : supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);