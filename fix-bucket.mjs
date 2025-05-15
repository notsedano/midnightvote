// Simple script to create a Supabase bucket for banners
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

// Read from .env file directly if needed
function readEnvFile() {
  try {
    const envFile = readFileSync('.env', 'utf8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  } catch (err) {
    console.log("Could not read .env file:", err.message);
    return {};
  }
}

// Get environment variables
const env = readEnvFile();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log("Environment variables loaded:");
console.log("- SUPABASE_URL present:", !!supabaseUrl);
console.log("- SUPABASE_KEY present:", !!supabaseKey);

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
    console.error("Please create a .env file with your Supabase credentials:");
    console.error("VITE_SUPABASE_URL=your-project-id");
    console.error("VITE_SUPABASE_ANON_KEY=your-anon-key");
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