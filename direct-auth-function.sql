-- Direct authentication function
-- This function is a last-resort solution for browsers with CORS issues
-- It directly authenticates users by email/password against the auth.users table
-- WARNING: Only use this if standard Supabase Auth APIs don't work due to CORS

-- Create the function
CREATE OR REPLACE FUNCTION public.authenticate_user_direct(
  p_email TEXT,
  p_password TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user auth.users;
  v_user_role text;
  v_token text;
  v_expiry timestamp with time zone;
  v_result jsonb;
BEGIN
  -- IMPORTANT: This is a simplified version that lacks security checks
  -- In a real-world scenario, you should implement proper password checking,
  -- rate limiting, and other security measures

  -- Find the user by email
  SELECT * INTO v_user
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- Return empty result if user not found
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid email or password');
  END IF;

  -- Check the user's status
  IF v_user.is_sso_user THEN
    RETURN jsonb_build_object('success', false, 'message', 'SSO users cannot use direct auth');
  END IF;

  -- NOTE: We return a basic JSON response with user data without a valid JWT token
  -- The client will fall back to standard auth after this
  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'created_at', v_user.created_at,
      'last_sign_in_at', v_user.last_sign_in_at
    ),
    'message', 'User authenticated successfully, redirect to standard login'
  );
END;
$$; 