// Banner Function Test Script
// This script tests if the banner functions are working correctly
// Run with: node test-banner-functions.js

import { createClient } from '@supabase/supabase-js';

// Get your Supabase URL and anon key from environment or hard-code them here
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Initialize Supabase client
const supabase = createClient(`https://${SUPABASE_URL}`, SUPABASE_ANON_KEY);

async function testBannerFunctions() {
  console.log('=== Testing Banner Functions ===\n');
  
  // Step 1: Test site_settings table access
  try {
    console.log('1. Testing direct access to site_settings table...');
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['login_banner1', 'login_banner2']);
      
    if (error) {
      console.error('  ❌ Error accessing site_settings:', error.message);
      console.log('  This is expected for anonymous users if RLS is working.');
    } else {
      console.log(`  ✅ Successfully accessed site_settings table! Found ${settings?.length || 0} settings`);
      console.log('  Current settings:', settings);
    }
  } catch (err) {
    console.error('  ❌ Error in direct access test:', err.message);
  }
  
  // Step 2: Test get_banner_urls RPC function
  try {
    console.log('\n2. Testing get_banner_urls RPC function...');
    const { data, error } = await supabase.rpc('get_banner_urls');
    
    if (error) {
      console.error('  ❌ Error calling get_banner_urls:', error.message);
      console.log('  Function may not be created or permissions are incorrect');
    } else {
      console.log('  ✅ Successfully called get_banner_urls function!');
      console.log('  Result:', data);
      
      // Extra validation
      if (data && (typeof data.banner1 === 'string' || typeof data.banner2 === 'string')) {
        console.log('  ✅ Banner data has the correct format');
      } else {
        console.error('  ❌ Banner data is missing or has incorrect format');
      }
    }
  } catch (err) {
    console.error('  ❌ Error in get_banner_urls test:', err.message);
  }
  
  // Step 3: Test update_site_setting RPC function
  try {
    console.log('\n3. Testing update_site_setting RPC function...');
    const testValue = `Test value ${new Date().toISOString()}`;
    
    const { data, error } = await supabase.rpc('update_site_setting', {
      setting_key: 'test_banner',
      setting_value: testValue
    });
    
    if (error) {
      console.error('  ❌ Error calling update_site_setting:', error.message);
      console.log('  Function may not be created or permissions are incorrect');
    } else {
      console.log('  ✅ Successfully called update_site_setting function!');
      console.log('  Result:', data);
      
      // Verify the setting was updated
      console.log('  Verifying setting was updated...');
      const { data: verifyData, error: verifyError } = await supabase.rpc('get_banner_urls');
      
      if (verifyError) {
        console.error('  ❌ Error verifying update:', verifyError.message);
      } else {
        console.log('  ✅ Retrieval after update successful');
      }
    }
  } catch (err) {
    console.error('  ❌ Error in update_site_setting test:', err.message);
  }
  
  // Step 4: Check storage bucket
  try {
    console.log('\n4. Testing storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('  ❌ Error listing storage buckets:', bucketsError.message);
    } else {
      console.log(`  ✅ Successfully listed buckets! Found ${buckets?.length || 0} buckets`);
      
      const bannersBucket = buckets?.find(b => b.name === 'banners');
      if (bannersBucket) {
        console.log('  ✅ Found banners bucket!');
        
        // Try listing files
        const { data: files, error: filesError } = await supabase.storage
          .from('banners')
          .list();
          
        if (filesError) {
          console.error('  ❌ Error listing files in banners bucket:', filesError.message);
        } else {
          console.log(`  ✅ Successfully listed files! Found ${files?.length || 0} files in banners bucket`);
        }
      } else {
        console.error('  ❌ banners bucket not found. You need to create it.');
        console.log('  Run the SQL commands to create the banners bucket:');
        console.log('  1. Go to Supabase Dashboard > Storage');
        console.log('  2. Click "New Bucket"');
        console.log('  3. Name it "banners" and check "Public bucket"');
      }
    }
  } catch (err) {
    console.error('  ❌ Error in storage access test:', err.message);
  }
  
  console.log('\n=== Testing Complete ===');
}

// Run the tests
testBannerFunctions()
  .catch(err => {
    console.error('Unhandled error:', err);
  }); 