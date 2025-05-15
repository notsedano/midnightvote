// Deploy Banner Fix Script
// This script automates the deployment of the banner fix
// Usage: node deploy-banner-fix.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// =========== CONFIGURATION ===========
// Get from environment or edit directly
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-project-id.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // Optional, for automatic Vercel deployment
const PROJECT_ID = process.env.VERCEL_PROJECT_ID; // Optional, for automatic Vercel deployment
// ====================================

const bucketName = 'banners';
const sqlFilePath = path.join(__dirname, 'fix-banner-functions.sql');

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function runDeployment() {
  console.log(`${colors.bright}${colors.cyan}===== BANNER FIX DEPLOYMENT =====\n${colors.reset}`);
  
  // Validate credentials
  if (SUPABASE_URL === 'your-project-id.supabase.co' || SUPABASE_SERVICE_KEY === 'your-service-role-key') {
    console.error(`${colors.bright}${colors.red}ERROR: Please provide your Supabase credentials${colors.reset}`);
    console.error('Edit this file or set the SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
    return;
  }

  try {
    // Initialize Supabase client
    console.log(`${colors.cyan}Connecting to Supabase at ${SUPABASE_URL}...${colors.reset}`);
    const supabase = createClient(`https://${SUPABASE_URL}`, SUPABASE_SERVICE_KEY);
    
    // 1. Create storage bucket if it doesn't exist
    console.log(`\n${colors.bright}${colors.yellow}STEP 1: Checking storage bucket${colors.reset}`);
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error(`${colors.red}Error listing buckets: ${error.message}${colors.reset}`);
        throw error;
      }
      
      const bucketExists = buckets && buckets.some(b => b.name === bucketName);
      
      if (bucketExists) {
        console.log(`${colors.green}✓ Banners bucket already exists${colors.reset}`);
      } else {
        console.log(`Creating storage bucket "${bucketName}"...`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, { 
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
        
        if (createError) {
          console.error(`${colors.red}Error creating bucket: ${createError.message}${colors.reset}`);
          throw createError;
        }
        
        console.log(`${colors.green}✓ Created public storage bucket "${bucketName}"${colors.reset}`);
      }
    } catch (err) {
      console.error(`${colors.red}Failed to set up storage bucket: ${err.message}${colors.reset}`);
      console.log(`${colors.yellow}Please create the bucket manually in the Supabase dashboard${colors.reset}`);
    }
    
    // 2. Execute SQL functions
    console.log(`\n${colors.bright}${colors.yellow}STEP 2: Setting up database functions${colors.reset}`);
    
    // Read SQL file
    let sqlContent;
    try {
      sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log(`Read SQL file: ${sqlFilePath}`);
    } catch (err) {
      console.error(`${colors.red}Failed to read SQL file: ${err.message}${colors.reset}`);
      console.error(`Make sure fix-banner-functions.sql exists in the same directory as this script`);
      return;
    }
    
    try {
      // We can't directly execute the SQL from the Node.js client
      // But we can check if the functions exist
      console.log('Testing if the SQL functions already exist...');
      
      const { data, error } = await supabase.rpc('get_banner_urls');
      
      if (!error) {
        console.log(`${colors.green}✓ get_banner_urls function already exists and is working${colors.reset}`);
      } else {
        console.error(`${colors.yellow}get_banner_urls function doesn't exist or isn't working: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}Please execute the following SQL in your Supabase SQL Editor:${colors.reset}`);
        console.log(`\n${colors.bright}${sqlContent}${colors.reset}\n`);
      }
    } catch (err) {
      console.error(`${colors.red}Error testing SQL function: ${err.message}${colors.reset}`);
      console.log(`${colors.yellow}Please execute the SQL script manually in the Supabase dashboard${colors.reset}`);
    }
    
    // 3. Verify site_settings table
    console.log(`\n${colors.bright}${colors.yellow}STEP 3: Checking site_settings table${colors.reset}`);
    
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['login_banner1', 'login_banner2']);
        
      if (error) {
        console.error(`${colors.red}Error querying site_settings: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}The table might not exist. Please run the SQL script.${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ site_settings table exists${colors.reset}`);
        
        if (!data || data.length < 2) {
          console.log('Adding default banner settings...');
          
          const { error: insertError } = await supabase
            .from('site_settings')
            .upsert([
              { key: 'login_banner1', value: '' },
              { key: 'login_banner2', value: '' }
            ], { onConflict: 'key' });
            
          if (insertError) {
            console.error(`${colors.red}Error adding default settings: ${insertError.message}${colors.reset}`);
          } else {
            console.log(`${colors.green}✓ Default banner settings added${colors.reset}`);
          }
        } else {
          console.log(`${colors.green}✓ Banner settings already exist in the database${colors.reset}`);
          console.log('Current banner settings:');
          data.forEach(setting => {
            console.log(`  - ${setting.key}: ${setting.value ? `${setting.value.substring(0, 30)}...` : '(empty)'}`);
          });
        }
      }
    } catch (err) {
      console.error(`${colors.red}Error checking site_settings table: ${err.message}${colors.reset}`);
    }
    
    // 4. Run test script to verify everything works
    console.log(`\n${colors.bright}${colors.yellow}STEP 4: Testing banner functions${colors.reset}`);
    
    try {
      console.log('Testing get_banner_urls function...');
      const { data, error } = await supabase.rpc('get_banner_urls');
      
      if (error) {
        console.error(`${colors.red}Error calling get_banner_urls: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}Make sure you've run the SQL script in the Supabase SQL Editor${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ get_banner_urls function is working correctly${colors.reset}`);
        console.log('Result:', data);
      }
    } catch (err) {
      console.error(`${colors.red}Error testing banner functions: ${err.message}${colors.reset}`);
    }
    
    // 5. Trigger deployment (optional)
    if (VERCEL_TOKEN && PROJECT_ID) {
      console.log(`\n${colors.bright}${colors.yellow}STEP 5: Triggering Vercel deployment${colors.reset}`);
      
      try {
        console.log('Running git commands to commit changes...');
        
        try {
          execSync('git add .', { stdio: 'inherit' });
          execSync('git commit -m "Fix banner display issues with RLS and SECURITY DEFINER functions"', { stdio: 'inherit' });
          execSync('git push', { stdio: 'inherit' });
          
          console.log(`${colors.green}✓ Changes committed and pushed to repository${colors.reset}`);
        } catch (gitErr) {
          console.error(`${colors.red}Git operations failed: ${gitErr.message}${colors.reset}`);
          console.log('Please commit and push your changes manually');
        }
        
        console.log('Triggering Vercel deployment...');
        
        // Call Vercel API to trigger deployment
        const response = await fetch(`https://api.vercel.com/v1/projects/${PROJECT_ID}/deployments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: 'production',
            meta: { description: 'Fix banner display issues' }
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log(`${colors.green}✓ Deployment triggered successfully${colors.reset}`);
          console.log(`Deployment URL: ${result.url}`);
        } else {
          console.error(`${colors.red}Deployment failed: ${result.error?.message || 'Unknown error'}${colors.reset}`);
        }
      } catch (err) {
        console.error(`${colors.red}Error triggering deployment: ${err.message}${colors.reset}`);
        console.log('Please deploy your changes manually');
      }
    } else {
      console.log(`\n${colors.bright}${colors.yellow}STEP 5: Manual deployment${colors.reset}`);
      console.log('No Vercel token provided. Please deploy your changes manually:');
      console.log('1. Commit your changes: git add . && git commit -m "Fix banner issues"');
      console.log('2. Push to your repository: git push');
      console.log('3. Your hosting provider should automatically deploy the changes');
    }
    
    // Final summary
    console.log(`\n${colors.bright}${colors.green}===== DEPLOYMENT COMPLETE =====\n${colors.reset}`);
    console.log(`${colors.cyan}What we've done:${colors.reset}`);
    console.log(`1. ${bucketExists ? 'Verified' : 'Created'} the "banners" storage bucket`);
    console.log(`2. Provided SQL script for database functions and RLS policies`);
    console.log(`3. Checked/created banner settings in the database`);
    console.log(`4. Tested the banner functions`);
    
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log(`1. Make sure the SQL script has been executed in Supabase SQL Editor`);
    console.log(`2. Deploy your application if it hasn't been done already`);
    console.log(`3. Test the login page banner display as both admin and anonymous user`);
    console.log(`4. Upload new banner images from the admin panel and verify they appear`);
    
  } catch (err) {
    console.error(`${colors.bright}${colors.red}ERROR: ${err.message}${colors.reset}`);
    console.error('Please check your Supabase credentials and try again');
  }
}

// Run the deployment
runDeployment().catch(err => {
  console.error(`${colors.bright}${colors.red}UNHANDLED ERROR: ${err.message}${colors.reset}`);
}); 