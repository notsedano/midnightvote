import { supabase } from '../lib/supabase';

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
      console.log('Falling back to localStorage only');
      // Don't throw error, just use localStorage
    }
    
    // Always update localStorage for immediate effect
    localStorage.setItem(key, value);
    console.log(`Updated localStorage for key: ${key}`);
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error('Error updating site setting:', error.message);
    console.error('Error details:', error);
    
    // Try localStorage as fallback
    try {
      localStorage.setItem(key, value);
      console.log(`Fallback: Updated localStorage for key: ${key}`);
      return {
        success: true,
        error: null
      };
    } catch (localError) {
      return {
        success: false,
        error
      };
    }
  }
} 