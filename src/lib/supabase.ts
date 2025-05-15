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

// Create a simpler client configuration without custom fetch
export const supabase = createClient<Database>(normalizedSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});