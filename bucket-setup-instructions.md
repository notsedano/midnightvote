# Fixing the "Bucket not found" Error

There are two ways to create the missing "banners" storage bucket for your application:

## Option 1: Using the included JavaScript scripts

1. First, verify your existing buckets:

   ```bash
   # Edit check-buckets.js with your actual Supabase URL and anon key
   node check-buckets.js
   ```

2. Create the "banners" bucket:

   ```bash
   # Edit create-bucket.js with your actual Supabase URL and service role key
   node create-bucket.js
   ```

   Note: The service role key has elevated permissions and should be kept secure.

## Option 2: Create the bucket manually in Supabase Dashboard

1. Log in to your Supabase project at https://app.supabase.com
2. Navigate to "Storage" in the left sidebar
3. Click "New Bucket"
4. Name it "banners"
5. Enable "Public bucket" if you want the images to be publicly accessible
6. Click "Create bucket"
7. Set up appropriate bucket policies:
   - Navigate to the "Policies" tab
   - Add policies for inserting and selecting files based on your requirements

## Verifying the Fix

After creating the bucket, your AdminPage.tsx should be able to upload images without the "Bucket not found" error. The code is already configured to use the "banners" bucket:

```javascript
// This is line 220-222 in AdminPage.tsx
const { error: uploadError } = await supabase.storage
  .from('banners')
  .upload(filePath, file);
```

## Troubleshooting

If you still encounter issues:

1. Make sure the bucket name in your code matches exactly (case-sensitive)
2. Check that your Supabase token has permissions to access storage
3. Verify that your storage service is enabled in your Supabase project
4. Try using the Supabase dashboard to manually upload a test file to the bucket 