// Script to create a new storage bucket in Supabase
// Run this with: node scripts/create-banners-bucket.js

// Try to load dotenv for environment variables
try {
  require('dotenv').config();
} catch (err) {
  console.log("Note: dotenv not found. Using manually entered credentials instead.");
}

// Get credentials from environment variables first, if available
const ENV_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const ENV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// IMPORTANT: Update these variables with your actual Supabase credentials
// These will be used as fallbacks if environment variables are not available
const SUPABASE_URL = ENV_SUPABASE_URL || "YOUR_SUPABASE_URL"; // from Project Settings > API
const SUPABASE_SERVICE_KEY = ENV_SUPABASE_SERVICE_KEY || "YOUR_SERVICE_ROLE_KEY"; // Service Role Key (not anon key)

// Try to load the required package
let createClient;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (err) {
  console.error("Error: @supabase/supabase-js package not found.");
  console.error("Please install it first with: npm install @supabase/supabase-js");
  process.exit(1);
}

// Normalize Supabase URL
function normalizeSupabaseUrl(url) {
  if (!url) return url;
  
  // Already a full URL
  if (url.startsWith('https://')) return url;
  
  // Domain without protocol
  if (url.includes('.supabase.co')) return `https://${url}`;
  
  // Just the project ID
  return `https://${url}.supabase.co`;
}

// Bucket configuration
const bucketName = 'banners';
const bucketIsPublic = true; // Makes bucket publicly accessible

async function createBucket() {
  // Normalize the URL
  const normalizedUrl = normalizeSupabaseUrl(SUPABASE_URL);
  
  if (normalizedUrl === "https://YOUR_SUPABASE_URL.supabase.co" || SUPABASE_SERVICE_KEY === "YOUR_SERVICE_ROLE_KEY") {
    console.error("\n⚠️  ERROR: You must provide Supabase credentials");
    console.error("Option 1: Create a .env file in the project root with:");
    console.error("  VITE_SUPABASE_URL=your-project-id");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-key");
    console.error("\nOption 2: Edit this file and replace:");
    console.error("1. YOUR_SUPABASE_URL with your actual Supabase URL");
    console.error("2. YOUR_SERVICE_ROLE_KEY with your Service Role Key");
    console.error("\nYou can find these in your Supabase dashboard under Project Settings > API");
    return;
  }

  try {
    console.log(`\n🔄 Connecting to Supabase at ${normalizedUrl}`);
    const supabase = createClient(normalizedUrl, SUPABASE_SERVICE_KEY);
    
    // First check if the bucket already exists
    console.log(`🔍 Checking if bucket "${bucketName}" already exists...`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets: ${listError.message}`);
      return;
    }
    
    const bucketExists = buckets && buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Success! Bucket "${bucketName}" already exists.`);
      return;
    }
    
    // Create the bucket
    console.log(`🛠️  Creating bucket "${bucketName}"...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: bucketIsPublic,
      fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
    });
    
    if (error) {
      console.error(`❌ Error creating bucket: ${error.message}`);
      return;
    }
    
    console.log(`\n✅ Success! Created bucket "${bucketName}"`);
    console.log(`🔒 Public access: ${bucketIsPublic ? 'Enabled' : 'Disabled'}`);
    console.log(`\n🎉 Your application should now be able to upload banner images!`);
    
  } catch (err) {
    console.error(`\n❌ Unexpected error: ${err.message}`);
    console.error("Please make sure your Supabase credentials are correct and you have the necessary permissions.");
  }
}

// Execute the function
createBucket(); 