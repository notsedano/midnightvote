-- Add youtube_url column to candidates table if it doesn't exist
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT NULL;

-- Test if the column was added successfully
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'candidates' 
  AND column_name = 'youtube_url'; 