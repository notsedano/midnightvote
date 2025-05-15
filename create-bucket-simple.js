// Simple script to create a Supabase bucket
// EDIT THESE TWO LINES with your info from Supabase dashboard:
const SUPABASE_URL = "YOUR_SUPABASE_URL"; // e.g. "https://abcdefghijk.supabase.co"
const SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY"; // Service Role Key (not anon key)

// Run this with: node create-bucket-simple.js

const { createClient } = require('@supabase/supabase-js');

async function createBannersBucket() {
  // Show a clear message if credentials weren't edited
  if (SUPABASE_URL === "YOUR_SUPABASE_URL") {
    console.error("ERROR: Please edit this file first!");
    console.error("Replace YOUR_SUPABASE_URL and YOUR_SERVICE_ROLE_KEY with your actual values");
    console.error("You can find these in your Supabase dashboard under Project Settings > API");
    return;
  }

  try {
    // Create Supabase client
    console.log("Connecting to Supabase...");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Create the banners bucket
    console.log("Creating 'banners' bucket...");
    const { data, error } = await supabase.storage.createBucket("banners", {
      public: true
    });
    
    if (error) {
      console.error("Error creating bucket:", error.message);
    } else {
      console.log("Success! The 'banners' bucket has been created");
      console.log("Your app should now work properly");
    }
  } catch (err) {
    console.error("Unexpected error:", err.message);
  }
}

createBannersBucket(); 