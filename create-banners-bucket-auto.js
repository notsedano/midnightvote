// Automated script to create the banners bucket in Supabase
// This script uses environment variables for credentials
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // This will load environment variables from .env file if it exists

// Get credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Bucket configuration
const bucketName = 'banners';
const bucketIsPublic = true;

async function ensureBannersBucket() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials in environment variables.');
    console.log('Please ensure you have the following variables set:');
    console.log('- VITE_SUPABASE_URL or SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
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
    
    // Create basic RLS policies
    console.log('Setting up basic policies...');
    
    // Policy to allow public file viewing (if bucket is public)
    if (bucketIsPublic) {
      await setupPolicy(supabase, 'SELECT');
    }
    
    // Policy to allow authenticated uploads
    await setupPolicy(supabase, 'INSERT');
    
    console.log('✅ Setup complete! Your application should now work properly.');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Helper function to set up RLS policies
async function setupPolicy(supabase, operation) {
  try {
    const policyName = operation === 'SELECT' 
      ? 'Allow public viewing' 
      : 'Allow authenticated uploads';
    
    const definition = operation === 'SELECT'
      ? 'true' // Public access for SELECT
      : 'auth.role() = \'authenticated\''; // Only authenticated users for INSERT
    
    const { error } = await supabase
      .rpc('storage.create_policy', {
        name: policyName,
        bucket: bucketName,
        operation: operation,
        definition: definition
      });
    
    if (error) {
      // Policy creation might fail if the RPC method isn't accessible
      // This is often a permissions issue, but bucket will still work
      console.log(`Note: Could not create ${operation} policy automatically.`);
      console.log('You might need to create it manually in the Supabase dashboard.');
    } else {
      console.log(`✅ Created ${operation} policy successfully!`);
    }
  } catch (err) {
    console.log(`Note: Could not create ${operation} policy: ${err.message}`);
    console.log('You might need to create it manually in the Supabase dashboard.');
  }
}

// Run the script
ensureBannersBucket(); 