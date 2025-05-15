-- Create a function to update site_settings that bypasses RLS
-- This will be callable via RPC even by anonymous users
CREATE OR REPLACE FUNCTION update_site_setting(setting_key TEXT, setting_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  -- Insert or update the setting
  INSERT INTO public.site_settings (key, value)
  VALUES (setting_key, setting_value)
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = setting_value,
    updated_at = now();
    
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating site setting: %', SQLERRM;
    RETURN FALSE;
END;
$$; 