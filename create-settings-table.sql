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

-- Policy for any authenticated user to read settings
CREATE POLICY "Anyone can read settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Policy for authenticated users to insert/update/delete settings
CREATE POLICY "Authenticated users can manage settings" 
ON public.site_settings 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Add initial settings if needed
INSERT INTO public.site_settings (key, value)
VALUES 
  ('login_banner1', ''),
  ('login_banner2', '')
ON CONFLICT (key) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.site_settings IS 'Table to store site-wide settings like banner URLs'; 