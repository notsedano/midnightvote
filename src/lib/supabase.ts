import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Enhanced URL normalization
function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  
  // Remove any leading/trailing whitespace
  url = url.trim();
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  // If it already has https://, keep it as is
  if (url.startsWith('https://')) {
    return url;
  }
  
  // If it already starts with the project ID format, add https://
  if (url.match(/^[a-z0-9-]+\.supabase\.co$/i)) {
    return `https://${url}`;
  }
  
  // If it's just the project ID, construct the full URL
  if (url.match(/^[a-z0-9]+$/i)) {
    return `https://${url}.supabase.co`;
  }
  
  // Default case: assume it's a full domain without protocol
  return `https://${url}`;
}

// Normalize URL
supabaseUrl = normalizeSupabaseUrl(supabaseUrl);

// Add debug logging
console.log("Supabase initialization:", { 
  finalUrl: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials. Authentication will not work properly.");
}

// Create client with improved error handling
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);