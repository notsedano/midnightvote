-- This function allows executing arbitrary SQL from the application
-- WARNING: This should be used with extreme caution as it can be a security risk if not properly secured
CREATE OR REPLACE FUNCTION exec_sql(sql_string text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a specific schema search path to limit where this function can reach
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_string;
END;
$$;

-- Secure the function by only allowing admins to use it
REVOKE ALL ON FUNCTION exec_sql FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role; 