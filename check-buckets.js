// Script to check available storage buckets in Supabase
const { createClient } = require('@supabase/supabase-js');

// Add your actual Supabase URL and anon key below
// You can find these in your Supabase dashboard under Project Settings > API
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon/public key (not service role key)

async function checkBuckets() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }
    
    if (!buckets || buckets.length === 0) {
      console.log('No buckets found in your Supabase project.');
      console.log('You need to create a bucket first.');
    } else {
      console.log('Available buckets in your Supabase project:');
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkBuckets(); 