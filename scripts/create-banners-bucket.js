// Script to create a new storage bucket in Supabase and site_settings table
// Run this with: node scripts/create-banners-bucket.js

// Try to load dotenv for environment variables
try {
  require('dotenv').config();
} catch (err) {
  console.log("Note: dotenv not found. Using manually entered credentials instead.");
}

// IMPORTANT: Update these variables with your actual Supabase credentials from your project
// To find these in Supabase: Project Settings > API
const SUPABASE_URL = "https://oipivldhfvhrcjfivq.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcGl2bGRoZnZocmNqZml2cSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NDczNjM3NzQsImV4cCI6MjA2Mjk0MDE3NH0.lrU-QOyMuhgqwtgO0F0K6Q3lhGkZPr06wgMPQb-Q9xE";

// Try to load the required package
let createClient;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (err) {
  console.error("Error: @supabase/supabase-js package not found.");
  console.error("Please install it first with: npm install @supabase/supabase-js");
  process.exit(1);
}

// Bucket configuration
const bucketName = 'banners';
const bucketIsPublic = true; // Makes bucket publicly accessible

async function createBucket() {
  try {
    console.log(`\n📄 Connecting to Supabase at ${SUPABASE_URL}`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    } else {
      // Create the bucket
      console.log(`🛠️ Creating bucket "${bucketName}"...`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: bucketIsPublic,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
      });

      if (error) {
        console.error(`❌ Error creating bucket: ${error.message}`);
        return;
      }

      console.log(`\n✅ Success! Created bucket "${bucketName}"`);
      console.log(`🔑 Public access: ${bucketIsPublic ? 'Enabled' : 'Disabled'}`);
    }
    
    // Now check if site_settings table exists
    console.log("\n🔍 Checking if site_settings table exists...");
    
    // First try a select on the table to see if it exists
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('key')
      .limit(1);
      
    if (settingsError) {
      console.error(`❌ Error checking site_settings table: ${settingsError.message}`);
      console.log("Creating site_settings table using SQL Editor...");
      
      // For safety, we won't execute SQL directly, but provide instructions
      console.log("\n🚨 IMPORTANT: Execute the following SQL in your Supabase SQL Editor:");
      console.log(`
-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for site_settings table
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy for any authenticated user to read settings
CREATE POLICY "Anyone can read settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Policy for authenticated users to insert/update/delete settings
CREATE POLICY "Authenticated users can manage settings" 
ON public.site_settings 
FOR ALL 
USING (auth.role() = 'authenticated');
      `);
    } else {
      console.log("✅ site_settings table already exists");
      
      // Check if banner settings exist
      const { data: bannerSettings, error: bannerError } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['login_banner1', 'login_banner2']);
        
      if (bannerError) {
        console.error(`❌ Error checking banner settings: ${bannerError.message}`);
      } else if (!bannerSettings || bannerSettings.length < 2) {
        console.log("🔧 Adding missing banner settings to the site_settings table...");
        
        // Insert default banner settings if they don't exist
        const { error: insertError } = await supabase
          .from('site_settings')
          .upsert([
            { key: 'login_banner1', value: '' },
            { key: 'login_banner2', value: '' }
          ], { onConflict: 'key' });
          
        if (insertError) {
          console.error(`❌ Error adding banner settings: ${insertError.message}`);
        } else {
          console.log("✅ Default banner settings added successfully!");
        }
      } else {
        console.log("✅ Banner settings are properly set up");
        // Print the current banner settings for debugging
        console.log("Current banner settings:");
        bannerSettings.forEach(setting => {
          console.log(`- ${setting.key}: ${setting.value ? (setting.value.substring(0, 30) + '...') : '(empty)'}`);
        });
      }
    }

    console.log(`\n🎉 Setup complete! Your application should now be able to upload and display banner images!`);

  } catch (err) {
    console.error(`\n❌ Unexpected error: ${err.message}`);
    console.error("Please make sure your Supabase credentials are correct and you have the necessary permissions.");
  }
}

// Execute the function
createBucket(); 