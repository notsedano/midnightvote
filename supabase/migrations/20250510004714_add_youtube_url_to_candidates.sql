ALTER TABLE public.candidates
ADD COLUMN youtube_url TEXT DEFAULT NULL;

-- Update the schema cache
COMMENT ON TABLE public.candidates IS '';
COMMENT ON COLUMN public.candidates.youtube_url IS 'YouTube video URL for the DJ';
