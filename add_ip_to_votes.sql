-- Migration script to add IP address column to votes table
-- Run this in the Supabase SQL Editor

-- First, add ip_address column to votes table
ALTER TABLE public.votes
ADD COLUMN ip_address TEXT;

-- Add an index for better performance when querying by IP
CREATE INDEX IF NOT EXISTS idx_votes_ip_address
ON public.votes(ip_address);

-- Update the RLS policy to allow storing IP address during vote
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;
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

-- Function to update existing votes with user IPs (where available)
-- This will attempt to backfill existing votes with IP data from profiles_ip
CREATE OR REPLACE FUNCTION public.backfill_vote_ips()
RETURNS void AS $$
BEGIN
  UPDATE public.votes v
  SET ip_address = p.ip_address
  FROM public.profiles_ip p
  WHERE v.user_id = p.user_id
  AND v.ip_address IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically fill missing IP addresses
CREATE OR REPLACE FUNCTION public.set_vote_ip_trigger_fn()
RETURNS trigger AS $$
BEGIN
  -- Only attempt to set IP if it's NULL in the newly inserted vote
  IF NEW.ip_address IS NULL OR NEW.ip_address = '' THEN
    -- Try to find an IP in the profiles_ip table for this user
    UPDATE public.votes
    SET ip_address = (
      SELECT ip_address 
      FROM public.profiles_ip 
      WHERE user_id = NEW.user_id 
      ORDER BY last_login DESC 
      LIMIT 1
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that executes after a vote is inserted
DROP TRIGGER IF EXISTS set_vote_ip ON public.votes;
CREATE TRIGGER set_vote_ip
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.set_vote_ip_trigger_fn();

-- Run this function to backfill existing votes:
SELECT public.backfill_vote_ips(); 