-- Simple SQL script to check for 'banners' bucket in Supabase
-- This version avoids complex string formatting

-- First check if the storage schema is accessible
DO $$ 
BEGIN
  -- Check if we can access the storage schema and buckets table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    -- We have access, now check if the bucket exists
    IF EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = 'banners'
    ) THEN
      RAISE NOTICE 'SUCCESS: The "banners" bucket already exists in your project.';
    ELSE
      RAISE NOTICE 'The "banners" bucket does not exist. Create it from the Storage section in your dashboard.';
      RAISE NOTICE 'Instructions:';
      RAISE NOTICE '1. Go to Storage in the left sidebar';
      RAISE NOTICE '2. Click "New Bucket"';
      RAISE NOTICE '3. Enter name: banners';
      RAISE NOTICE '4. Check "Public bucket" if images should be publicly accessible';
      RAISE NOTICE '5. Click "Create bucket"';
    END IF;
  ELSE
    RAISE NOTICE 'Cannot access storage schema. Please create the bucket manually:';
    RAISE NOTICE '1. Go to Storage in the left sidebar';
    RAISE NOTICE '2. Click "New Bucket"';
    RAISE NOTICE '3. Enter name: banners';
    RAISE NOTICE '4. Check "Public bucket" if images should be publicly accessible';
    RAISE NOTICE '5. Click "Create bucket"';
  END IF;
END $$; 