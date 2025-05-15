import { supabase } from '../lib/supabase';

/**
 * Uploads an image to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path The path within the bucket where the file should be stored
 * @returns An object with the upload result
 */
export async function uploadImage(file: File, bucket: string, path: string): Promise<{
  publicUrl: string | null;
  error: Error | null;
}> {
  try {
    console.log(`Attempting to upload to bucket: ${bucket}, path: ${path}`);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Authentication status:", user ? "Authenticated" : "Not authenticated");
    
    // Upload the file to the specified bucket and path
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { 
        upsert: true,
        cacheControl: '2592000' // 30 days cache for better performance
      });
      
    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw uploadError;
    }
    
    console.log("Upload successful, getting public URL");
    
    // Get the public URL for the uploaded file
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    if (!data.publicUrl) {
      console.error("Public URL not returned");
    } else {
      console.log("Public URL obtained:", data.publicUrl);
    }
    
    return {
      publicUrl: data.publicUrl,
      error: null
    };
  } catch (error: any) {
    console.error('Error uploading image:', error.message);
    console.error('Error details:', error);
    return {
      publicUrl: null,
      error
    };
  }
}

/**
 * Updates a site setting in the database and localStorage
 * @param key The setting key
 * @param value The setting value
 * @returns An object with the update result
 */
export async function updateSiteSetting(key: string, value: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    console.log(`Updating site setting: ${key} with value length: ${value.length}`);
    
    // Always update localStorage for immediate local effect
    localStorage.setItem(key, value);
    console.log(`Updated localStorage for key: ${key}`);
    
    // Then try to update in database
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value });
      
    if (error) {
      // Database error handling
      console.error('Site setting update error:', error);
      console.warn('Failed to update database. This means other users will not see the banner image.');
      
      // Try again using a direct API call to bypass RLS issues
      try {
        console.log("Trying alternative method to update setting...");
        
        // This method might work even if the first fails due to RLS issues
        const { error: altError } = await supabase.rpc('update_site_setting', { 
          setting_key: key,
          setting_value: value 
        });
        
        if (altError) {
          console.error('Alternative update method also failed:', altError);
          throw error; // Use the original error for consistency
        } else {
          console.log("Alternative update method successful!");
          return {
            success: true,
            error: null
          };
        }
      } catch (rpcError) {
        console.error('RPC error:', rpcError);
        throw error; // Use the original error for consistency
      }
    }
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error('Error updating site setting:', error.message);
    console.error('Error details:', error);
    
    return {
      success: false,
      error
    };
  }
} 