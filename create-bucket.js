// Script to create a new storage bucket in Supabase
const { createClient } = require('@supabase/supabase-js');

// Add your actual Supabase URL and service role key below
// You can find these in your Supabase dashboard under Project Settings > API
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your actual URL from Project Settings > API
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Replace with your actual service role key (not the anon key)

// New bucket configuration
const bucketName = 'banners'; // You can change this to any name you prefer
const bucketIsPublic = true;   // Public buckets allow anyone to read their contents

async function createBucket() {
  try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create a new bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: bucketIsPublic,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
    });
    
    if (error) {
      console.error('Error creating bucket:', error.message);
      return;
    }
    
    console.log(`Successfully created bucket: ${bucketName}`);
    console.log(`Public access: ${bucketIsPublic ? 'Enabled' : 'Disabled'}`);
    console.log(`Next step: Update your AdminPage.tsx file to use bucket name: '${bucketName}'`);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createBucket(); 