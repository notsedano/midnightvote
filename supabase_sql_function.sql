-- SQL function to bypass RLS policies for candidate insertion
-- Copy this SQL and run it in the Supabase SQL Editor

-- Function to directly insert a candidate
CREATE OR REPLACE FUNCTION public.direct_insert_candidate(
  name_param TEXT,
  genre_param TEXT,
  instagram_param TEXT DEFAULT NULL,
  bio_param TEXT DEFAULT NULL
) RETURNS SETOF candidates
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the privileges of the creator
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.candidates (
    name, 
    genre, 
    instagram_username,
    bio,
    created_at
  )
  VALUES (
    name_param,
    genre_param,
    instagram_param,
    bio_param,
    NOW()
  )
  RETURNING *;
END;
$$;

-- Grant execution privileges to authenticated users
GRANT EXECUTE ON FUNCTION public.direct_insert_candidate TO authenticated;

-- Simplified emergency function (minimal params)
CREATE OR REPLACE FUNCTION public.emergency_insert_candidate(
  p_name TEXT,
  p_genre TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.candidates (name, genre, created_at)
  VALUES (p_name, p_genre, NOW());
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.emergency_insert_candidate TO authenticated; 