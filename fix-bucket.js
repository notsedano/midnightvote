// Simple script to create a Supabase bucket for banners
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const bucketName = 'banners';

async function createBannersBucket() {
  console.log("Starting Supabase bucket creation...");
  
  // Normalize URL if needed
  let url = supabaseUrl || '';
  if (!url.startsWith('https://')) {
    if (url.includes('.supabase.co')) {
      url = `https://${url}`;
    } else {
      url = `https://${url}.supabase.co`;
    }
  }
  
  console.log(`Using Supabase URL: ${url}`);
  
  if (!supabaseKey) {
    console.error("ERROR: VITE_SUPABASE_ANON_KEY is not defined in your .env file");
    return;
  }
  
  try {
    // Create Supabase client with available credentials
    const supabase = createClient(url, supabaseKey);
    
    // First check if bucket already exists
    console.log("Checking if 'banners' bucket already exists...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError.message);
      return;
    }
    
    const bucketExists = buckets && buckets.find(b => b.name === bucketName);
    
    if (bucketExists) {
      console.log("✅ 'banners' bucket already exists!");
      return;
    }
    
    // Create the bucket if it doesn't exist
    console.log("Creating 'banners' bucket...");
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError.message);
      console.log("\nTo create the bucket manually:");
      console.log("1. Go to your Supabase dashboard: https://app.supabase.com");
      console.log("2. Navigate to Storage > Buckets");
      console.log("3. Create a new bucket named 'banners'");
      console.log("4. Set it as a public bucket");
      return;
    }
    
    console.log("✅ Success! 'banners' bucket created.");
    
  } catch (err) {
    console.error("Unexpected error:", err.message);
  }
}

createBannersBucket(); 