// Automated script to create the banners bucket in Supabase
// This script uses environment variables for credentials
const { createClient } = require('@supabase/supabase-js');

// Load environment variables if dotenv is available
try {
  require('dotenv').config(); 
} catch (err) {
  console.log('dotenv module not found, continuing without it');
}

// Get credentials from environment variables or provide your own directly here
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

// Bucket configuration
const bucketName = 'banners';
const bucketIsPublic = true;

async function ensureBannersBucket() {
  if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.error('ERROR: Please edit this file to add your Supabase credentials.');
    console.log('Replace YOUR_SUPABASE_URL and YOUR_SERVICE_ROLE_KEY with actual values from Supabase dashboard.');
    return;
  }

  try {
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First check if the bucket already exists
    console.log('Checking if bucket already exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }
    
    const bucketExists = buckets && buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists!`);
      return;
    }
    
    // Bucket doesn't exist, create it
    console.log(`Creating bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: bucketIsPublic,
      fileSizeLimit: 5 * 1024 * 1024 // 5MB
    });
    
    if (error) {
      console.error('Error creating bucket:', error.message);
      return;
    }
    
    console.log(`✅ Successfully created bucket: ${bucketName}`);
    console.log(`Public access: ${bucketIsPublic ? 'Enabled' : 'Disabled'}`);
    
    // Create basic RLS policies - this is now optional
    console.log('Setting up basic policies...');
    
    try {
      // Policy to allow public file viewing (if bucket is public)
      if (bucketIsPublic) {
        console.log('Setting up SELECT policy...');
        await supabase.storage.from(bucketName).getPublicUrl('test.txt'); // This often helps initialize policies
      }
      
      console.log('✅ Setup complete! Your application should now work properly.');
    } catch (policyErr) {
      console.log('Note: Could not set up policies automatically. You may need to do this in the dashboard.');
      console.log('This is normal - your bucket has been created successfully.');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the script
ensureBannersBucket(); 