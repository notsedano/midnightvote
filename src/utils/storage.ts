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
 * Updates a site setting in the database or localStorage
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
    
    // First try to update in database
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value });
      
    if (error) {
      console.error('Site setting update error:', error);
      console.warn('Failed to update database. This means other users will not see the banner image.');
      throw error; // Throw error to indicate database failure
    }
    
    // Only update localStorage if database update succeeded
    localStorage.setItem(key, value);
    console.log(`Updated localStorage for key: ${key}`);
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error('Error updating site setting:', error.message);
    console.error('Error details:', error);
    
    // Still update localStorage for the current user's experience
    try {
      localStorage.setItem(key, value);
      console.log(`Fallback: Updated localStorage for key: ${key}`);
    } catch (localError) {
      console.error('Failed to update even localStorage:', localError);
    }
    
    return {
      success: false,
      error
    };
  }
} 