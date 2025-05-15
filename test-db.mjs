// Simple script to test database connection
import { createClient } from '@supabase/supabase-js';

// Use the same URL that's showing in your error message
const supabaseUrl = 'https://oipivldhfvhrcjfivq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcGl2bGRoZnZocmNqZml2cSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQ3MzYzNzc0LCJleHAiOjIwNjI5NDAxNzR9.YZ3QVl7JQmfvZ4b5Z7HTVXo24-9RwHGkYnEMEXT7F44';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // 1. Test site_settings table
    console.log('\nTesting site_settings table...');
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(5);
      
    if (settingsError) {
      console.error('Error accessing site_settings:', settingsError.message);
      if (settingsError.code === '42P01') {
        console.error('Table "site_settings" does not exist!');
      }
      if (settingsError.code === 'PGRST116') {
        console.error('Row-level security policy error - check your permissions');
      }
    } else {
      console.log('✅ site_settings table accessible');
      console.log(`Found ${settings.length} settings:`);
      console.log(settings);
    }
    
    // 2. Test banners bucket
    console.log('\nTesting storage bucket...');
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing storage buckets:', bucketError.message);
    } else {
      console.log('✅ Storage accessible');
      console.log('Available buckets:', bucketList.map(b => b.name).join(', '));
      
      // Check if banners bucket exists
      const bannersBucket = bucketList.find(b => b.name === 'banners');
      if (bannersBucket) {
        console.log('✅ banners bucket exists');
        
        // List files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('banners')
          .list();
          
        if (filesError) {
          console.error('Error listing files in banners bucket:', filesError.message);
        } else {
          console.log(`Found ${files.length} files in banners bucket:`);
          files.forEach(file => {
            console.log(`- ${file.name}`);
          });
        }
      } else {
        console.error('❌ banners bucket not found!');
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

testDatabase(); 