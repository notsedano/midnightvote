-- Create profiles_ip table for tracking user IP addresses
CREATE TABLE IF NOT EXISTS public.profiles_ip (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  login_count INTEGER DEFAULT 1
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_ip_user_id ON public.profiles_ip(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ip_ip_address ON public.profiles_ip(ip_address);

-- Add RLS policies for security
ALTER TABLE public.profiles_ip ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view all IPs
CREATE POLICY "Admins can view all IP data" ON public.profiles_ip
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Allow users to view their own IP data
CREATE POLICY "Users can view their own IP data" ON public.profiles_ip
  FOR SELECT
  USING (user_id = auth.uid());

-- Only the system and admins can insert/update IP data
CREATE POLICY "System can insert IP data" ON public.profiles_ip
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can update IP data" ON public.profiles_ip
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Create a function to update login_count
CREATE OR REPLACE FUNCTION public.update_ip_login_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.login_count = COALESCE(OLD.login_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update login_count on update
CREATE TRIGGER update_login_count_trigger
BEFORE UPDATE ON public.profiles_ip
FOR EACH ROW
EXECUTE FUNCTION public.update_ip_login_count();

-- Add function to get IP stats for admin dashboard
CREATE OR REPLACE FUNCTION public.get_ip_stats()
RETURNS TABLE (
  total_users BIGINT,
  unique_ips BIGINT,
  most_recent_login TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      COUNT(DISTINCT user_id)::BIGINT AS total_users,
      COUNT(DISTINCT ip_address)::BIGINT AS unique_ips,
      MAX(last_login) AS most_recent_login
    FROM
      public.profiles_ip;
END;
$$ LANGUAGE plpgsql; 