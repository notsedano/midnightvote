import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Ensure URL has proper format
let normalizedSupabaseUrl = supabaseUrl;
if (normalizedSupabaseUrl) {
  // Remove any trailing slashes
  normalizedSupabaseUrl = normalizedSupabaseUrl.replace(/\/+$/, '');
  
  // Ensure URL starts with https://
  if (!normalizedSupabaseUrl.startsWith('https://')) {
    normalizedSupabaseUrl = 'https://' + normalizedSupabaseUrl;
  }
}

// Create client with a very specific configuration to avoid CORS issues
export const supabase = createClient<Database>(normalizedSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      // This is specifically to handle Safari's strict CORS implementation
      const [url, options = {}] = args;
      const headers = new Headers(options.headers || {});
      
      // Try without credentials mode for auth endpoints
      const urlStr = url.toString();
      const isAuthEndpoint = urlStr.includes('/auth/v1/');
      
      const customOptions = {
        ...options,
        headers,
        mode: 'cors' as RequestMode,
        credentials: isAuthEndpoint ? 'omit' as RequestCredentials : 'include' as RequestCredentials,
      };
      
      return fetch(url, customOptions)
        .then(response => {
          // Log response info for debugging
          console.log(`[Supabase Fetch] ${options.method || 'GET'} ${urlStr.split('?')[0]}: ${response.status}`);
          return response;
        })
        .catch(error => {
          console.error(`[Supabase Fetch Error] ${options.method || 'GET'} ${urlStr.split('?')[0]}:`, error);
          throw error;
        });
    }
  }
});