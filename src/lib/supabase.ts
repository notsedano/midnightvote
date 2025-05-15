import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add debug logging
console.log("Supabase initialization:", { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length,
  // Show first few characters for debugging
  urlStart: supabaseUrl?.substring(0, 15) + "..."
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase connection');
}

// Ensure URL has proper format
let normalizedSupabaseUrl = supabaseUrl;
if (normalizedSupabaseUrl) {
  // Remove any trailing slashes
  normalizedSupabaseUrl = normalizedSupabaseUrl.replace(/\/+$/, '');
  
  // Ensure URL starts with https://
  if (!normalizedSupabaseUrl.startsWith('https://')) {
    normalizedSupabaseUrl = 'https://' + normalizedSupabaseUrl;
  }
  
  console.log("Normalized Supabase URL:", normalizedSupabaseUrl);
}

// Create client with specific options for debugging
export const supabase = createClient<Database>(normalizedSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      // Add custom fetch options for CORS
      const [url, options = {}] = args;
      const customOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-store',
        },
        mode: 'cors' as RequestMode,
        credentials: 'include' as RequestCredentials,
      };
      console.log("Fetch request:", { url, customOptions });
      return fetch(url, customOptions);
    }
  }
});