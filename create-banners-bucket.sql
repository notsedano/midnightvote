-- SQL script to check for 'banners' bucket and provide instructions
-- Run this in the Supabase SQL Editor (Database -> SQL Editor)

-- First, let's create a function to show the bucket creation instructions
CREATE OR REPLACE FUNCTION show_bucket_creation_instructions()
RETURNS TEXT AS $$
BEGIN
    RETURN 
    '
    -- BANNERS BUCKET NOT FOUND --
    
    The "banners" bucket does not exist in your Supabase project.
    Since storage buckets cannot be created via SQL, you must:
    
    1. Go to Storage in the left sidebar
    2. Click "New Bucket"
    3. Enter name: banners
    4. Check "Public bucket" if images should be publicly accessible
    5. Click "Create bucket"
    6. Set up appropriate policies:
       - Go to "Policies" tab in the new bucket
       - Create policies for SELECT (read) and INSERT (upload)
    
    After creating the bucket, your application should work properly.
    ';
END;
$$ LANGUAGE plpgsql;

-- Check if the 'supabase_storage' extension is available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'supabase_storage'
    ) THEN
        -- Extension exists, we can check for the bucket
        -- Try to find the bucket in storage.buckets table
        IF EXISTS (
            SELECT 1 FROM storage.buckets WHERE name = 'banners'
        ) THEN
            RAISE NOTICE 'SUCCESS: The "banners" bucket already exists in your project.';
        ELSE
            -- Bucket doesn't exist, show instructions
            RAISE NOTICE '%', show_bucket_creation_instructions();
        END IF;
    ELSE
        -- Extension doesn't exist or we can't access it
        RAISE NOTICE 'Cannot check for storage buckets - storage extension not accessible via SQL.';
        RAISE NOTICE '%', show_bucket_creation_instructions();
    END IF;
END $$;

-- Note: This script doesn't create the bucket itself, as that requires
-- using the Supabase Storage API or Dashboard interface. 