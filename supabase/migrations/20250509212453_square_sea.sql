/*
  # Initial database setup for DJ Competition

  1. New Tables
    - `candidates` - Store DJ candidate information
    - `votes` - Record user votes
    - `profiles` - Extended user profile information
  
  2. Security
    - Enable RLS on all tables
    - Set up policies for access control
*/

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  genre TEXT NOT NULL,
  image_url TEXT,
  instagram_username TEXT,
  bio TEXT
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  candidate_id INTEGER NOT NULL REFERENCES candidates(id),
  transaction_id TEXT NOT NULL UNIQUE
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  has_voted BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Candidates policies
CREATE POLICY "Anyone can view candidates"
  ON candidates
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Only admins can insert candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

CREATE POLICY "Only admins can update candidates"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

CREATE POLICY "Only admins can delete candidates"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- Votes policies
CREATE POLICY "Users can view all votes"
  ON votes
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM votes
      WHERE votes.user_id = auth.uid()
    )
  );

CREATE POLICY "Nobody can update votes"
  ON votes
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Nobody can delete votes"
  ON votes
  FOR DELETE
  TO authenticated
  USING (false);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create function to create a profile after signup
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();