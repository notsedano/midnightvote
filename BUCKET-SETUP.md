# Automating Supabase "banners" Bucket Creation

This guide provides three different methods to create the required "banners" storage bucket in your Supabase project.

## Method 1: Automated JavaScript Script (Recommended)

The `create-banners-bucket-auto.js` script will automatically create the "banners" bucket using environment variables.

### Setup:

1. Create a `.env` file in the project root with the following content:
   ```
   # Your Supabase project URL
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   
   # Your Supabase service role key (from Project Settings > API)
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. Run the automated script:
   ```bash
   node create-banners-bucket-auto.js
   ```

This script will:
- Check if the "banners" bucket already exists
- Create the bucket if it doesn't exist
- Set up appropriate security policies
- Provide detailed output about the process

## Method 2: SQL Script (Database Check Only)

The `create-banners-bucket.sql` script can be run in the Supabase SQL Editor to check if the bucket exists.

1. Go to your Supabase Dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Create a "New query"
4. Copy and paste the contents of `create-banners-bucket.sql`
5. Click "Run" to execute the script

This script only checks for the bucket's existence and provides instructions - it cannot create the bucket directly as buckets must be created through the Storage API or Dashboard.

## Method 3: Manual Creation via Dashboard

1. Log in to your Supabase project at https://app.supabase.com
2. Navigate to "Storage" in the left sidebar
3. Click "New Bucket"
4. Enter "banners" as the bucket name
5. Enable "Public bucket" if you want the images to be publicly accessible
6. Click "Create bucket"
7. Set up policies for the bucket:
   - Navigate to the "Policies" tab 
   - Add a policy for SELECT (read access)
   - Add a policy for INSERT (upload access)

## Environment Variables Reference

Your application needs the following environment variables:

```
# Public variables (used by the frontend)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Secret variables (only used by scripts, not included in frontend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

You can find these values in your Supabase dashboard under "Project Settings" > "API". 