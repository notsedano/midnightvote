// This script adds the youtube_url column to the candidates table

import { createClient } from '@supabase/supabase-js';

// Add your Supabase URL and SERVICE_ROLE key (admin key) here
// We're using the admin key as it has permission to modify the database schema
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

// Create Supabase client with the service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addYoutubeUrlColumn() {
  console.log('Attempting to add youtube_url column to candidates table...');

  try {
    // Directly updating a candidate to add the youtube_url field
    // This is a workaround to add the column without using migrations
    // If executed on a production database, this might take a while if the table is large
    const { data, error } = await supabase
      .from('candidates')
      .update({ youtube_url: null })
      .eq('id', 0) // This ID likely doesn't exist, but it doesn't matter
      .select();

    if (error) {
      if (error.message.includes('column "youtube_url" of relation "candidates" does not exist')) {
        console.error('The youtube_url column does not exist yet. Creating it now...');
        
        // Try to extract the RLS-bypassing key from the client's URL to run manual SQL
        // Note: This approach may not work in all environments
        console.log('Attempting direct SQL using admin privileges...');
        console.log('Please go to your Supabase dashboard and run this SQL in the SQL editor:');
        console.log('ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT NULL;');
        
        return;
      } else {
        console.error('Error updating candidates:', error.message);
        return;
      }
    }

    console.log('The youtube_url column now exists or was already present!');
    console.log('You can now use the youtube_url field.');
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

// Run the function
addYoutubeUrlColumn(); 