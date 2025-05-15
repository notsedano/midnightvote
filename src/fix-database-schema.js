import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function addYoutubeUrlColumn() {
  console.log('Adding youtube_url column to candidates table...');
  
  try {
    // Use PostgreSQL command to add the column if it doesn't exist
    const { error } = await supabase.rpc('add_youtube_url_column');
    
    if (error) {
      // If the RPC function doesn't exist, create it first
      console.log('Creating RPC function...');
      
      // Create the RPC function that will add the column
      const { error: createFnError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION add_youtube_url_column()
          RETURNS void AS $$
          BEGIN
            -- Check if the column already exists, if not add it
            IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'candidates'
              AND column_name = 'youtube_url'
            ) THEN
              ALTER TABLE candidates ADD COLUMN youtube_url TEXT DEFAULT NULL;
            END IF;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      if (createFnError) {
        console.error('Error creating RPC function:', createFnError.message);
        // If we can't create the function, try direct SQL execution
        console.log('Trying direct SQL execution...');
        
        const { error: sqlError } = await supabase.from('candidates')
          .select('id')
          .limit(1)
          .then(() => {
            console.log('Database connected, but could not add column using RPC.');
            console.log('Please run this SQL manually in your database:');
            console.log('ALTER TABLE public.candidates ADD COLUMN youtube_url TEXT DEFAULT NULL;');
          });
        
        if (sqlError) {
          console.error('Error accessing database:', sqlError.message);
        }
        
        return;
      }
      
      // Now execute the function
      const { error: execError } = await supabase.rpc('add_youtube_url_column');
      
      if (execError) {
        console.error('Error executing RPC function:', execError.message);
        return;
      }
    }
    
    console.log('Successfully added youtube_url column to candidates table!');
    
    // Verify the column was added
    const { data, error: verifyError } = await supabase
      .from('candidates')
      .select('id')
      .limit(1);
      
    if (verifyError) {
      console.error('Error verifying database connection:', verifyError.message);
      return;
    }
    
    console.log('Database connection verified. You can now use the youtube_url field.');
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

// Run the function
addYoutubeUrlColumn(); 