// Create Banners Bucket Script
// Creates the necessary storage bucket for banner images
// Usage: Add your Supabase credentials below and run with node create-banners-bucket.js

import { createClient } from '@supabase/supabase-js';

// Import credentials from config file (create this file with your credentials)
// If the import fails, we'll fall back to environment variables or defaults
let SUPABASE_URL = 'your-project-id.supabase.co';
let SUPABASE_SERVICE_KEY = 'your-service-role-key';

try {
  const config = await import('./test-config.js');
  SUPABASE_URL = config.SUPABASE_URL;
  SUPABASE_SERVICE_KEY = config.SUPABASE_SERVICE_KEY;
  console.log('Using credentials from test-config.js');
} catch (error) {
  // Use environment variables as fallback
  SUPABASE_URL = process.env.SUPABASE_URL || SUPABASE_URL;
  SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY;
  console.log('Using credentials from environment variables or defaults');
}

const bucketName = 'banners';
const bucketIsPublic = true; // Makes bucket publicly accessible

async function createBucket() {
  // Validate credentials
  if (SUPABASE_URL === 'your-project-id.supabase.co' || SUPABASE_SERVICE_KEY === 'your-service-role-key') {
    console.error('\n❌ ERROR: Please edit test-config.js or provide environment variables with your Supabase credentials.');
    console.error('You can find them in your Supabase dashboard under Project Settings > API');
    console.error('The service role key is required (not the anon key)\n');
    return;
  }

  try {
    console.log(`\n📄 Connecting to Supabase at ${SUPABASE_URL}`);
    const supabase = createClient(`https://${SUPABASE_URL}`, SUPABASE_SERVICE_KEY);

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
      console.log("\n🚨 IMPORTANT: Execute the fix-banner-functions.sql script in your Supabase SQL Editor!");
      console.log("This will create the necessary table, policies, and functions.");
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
    console.log("Next steps:");
    console.log("1. Run the SQL script in Supabase if you haven't already (fix-banner-functions.sql)");
    console.log("2. Test the functionality with test-banner-functions.js");
    console.log("3. Restart your application and try uploading banners from the admin panel\n");

  } catch (err) {
    console.error(`\n❌ Unexpected error: ${err.message}`);
    console.error("Please make sure your Supabase credentials are correct and you have the necessary permissions.");
  }
}

// Run the script
createBucket(); 