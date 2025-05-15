-- First, check if the table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_settings') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.site_settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
    
    -- Add comment
    COMMENT ON TABLE public.site_settings IS 'Stores site-wide settings like banner URLs';
  END IF;
END
$$;

-- Make sure RLS is enabled
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create or replace the policies (one at a time)
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;
CREATE POLICY "Anyone can read settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.site_settings;
CREATE POLICY "Authenticated users can manage settings" 
ON public.site_settings 
FOR ALL 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anon users can manage settings temporarily" ON public.site_settings;
CREATE POLICY "Anon users can manage settings temporarily" 
ON public.site_settings 
FOR ALL 
USING (auth.role() = 'anon');

-- Now create the helper function
CREATE OR REPLACE FUNCTION public.update_site_setting(setting_key TEXT, setting_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.site_settings (key, value)
  VALUES (setting_key, setting_value)
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = setting_value,
    updated_at = now();
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Add initial settings if they don't exist
INSERT INTO public.site_settings (key, value)
VALUES 
  ('login_banner1', ''),
  ('login_banner2', '')
ON CONFLICT (key) DO NOTHING;

-- Show current settings
SELECT * FROM public.site_settings; 