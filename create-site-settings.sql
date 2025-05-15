-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for site_settings table
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to read settings (even anonymous users)
CREATE POLICY "Anyone can read settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Policy for authenticated users to insert/update/delete settings
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.site_settings;

CREATE POLICY "Authenticated users can manage settings" 
ON public.site_settings 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Policy specifically for anonymous users to update settings (temporarily to fix the issue)
CREATE POLICY "Anon users can manage settings temporarily" 
ON public.site_settings 
FOR ALL 
USING (auth.role() = 'anon');

-- Add initial settings if needed
INSERT INTO public.site_settings (key, value)
VALUES 
  ('login_banner1', ''),
  ('login_banner2', '')
ON CONFLICT (key) DO NOTHING;

-- Show current settings
SELECT * FROM public.site_settings; 