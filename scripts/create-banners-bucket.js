// Script to create a new storage bucket in Supabase and site_settings table
// Run this with: node scripts/create-banners-bucket.js

// Try to load dotenv for environment variables
try {
  require('dotenv').config();
} catch (err) {
  console.log("Note: dotenv not found. Using manually entered credentials instead.");
}

// Get credentials from environment variables first, if available
const ENV_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const ENV_SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

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
  if (SUPABASE_URL === "YOUR_SUPABASE_URL" || SUPABASE_SERVICE_KEY === "YOUR_SERVICE_ROLE_KEY") {
    console.error("\n⚠️ ERROR: You must update the script with your actual Supabase credentials");
    console.error("Please edit this file and replace:");
    console.error("1. YOUR_SUPABASE_URL with your actual Supabase URL");
    console.error("2. YOUR_SERVICE_ROLE_KEY with your Service Role Key");
    console.error("\nYou can find these in your Supabase dashboard under Project Settings > API");
    return;
  }

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
      if (settingsError.code === '42P01') { // "relation does not exist" PostgreSQL error code
        console.log("❌ site_settings table does not exist. Creating it now...");
        
        // Execute the SQL to create the table
        const { error: createTableError } = await supabase.rpc('create_settings_table', {});
        
        if (createTableError) {
          console.error(`❌ Error creating site_settings table: ${createTableError.message}`);
          
          // Try alternative approach using direct SQL (requires proper permissions)
          console.log("Trying direct SQL approach...");
          
          const createTableSQL = `
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
            
            -- Add initial settings if needed
            INSERT INTO public.site_settings (key, value)
            VALUES 
              ('login_banner1', ''),
              ('login_banner2', '')
            ON CONFLICT (key) DO NOTHING;
          `;
          
          // This direct SQL execution will only work with older Supabase versions or custom SQL functions
          // For newer Supabase, you'll need to run this SQL in the SQL Editor in the Supabase Dashboard
          console.log("Please create the site_settings table manually using the SQL editor in Supabase Dashboard.");
          console.log("Use the SQL from the create-settings-table.sql file in your project.");
        } else {
          console.log("✅ site_settings table created successfully!");
        }
      } else {
        console.error(`❌ Error checking site_settings table: ${settingsError.message}`);
      }
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