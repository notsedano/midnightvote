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

-- You can run this function to backfill existing votes:
SELECT public.backfill_vote_ips(); 