# Banner Image Fix Instructions

This document contains step-by-step instructions to fix the issue where banner images uploaded in the admin panel don't appear for other users on the login page.

## Problem Description

Banner images uploaded by admins are being stored in Supabase storage correctly, but they're not being properly displayed to other users (especially anonymous users) due to permission issues and missing helper functions.

## Solution Overview

We need to implement these fixes:

1. Create proper SQL tables with appropriate Row Level Security (RLS) policies
2. Add SECURITY DEFINER functions to bypass RLS restrictions
3. Create a storage bucket with proper permissions
4. Update the app code to use these new functions (already done in the code)

## Step-by-Step Instructions

### 1. Run the SQL Script in Supabase

First, you need to execute the SQL script to set up the database table, policies, and functions:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `fix-banner-functions.sql` and paste it into the SQL Editor
4. Click "Run" to execute the script
5. Verify that it runs without errors

This script will:
- Create the `site_settings` table if it doesn't exist
- Set up proper RLS policies
- Create two helper functions:
  - `update_site_setting` - For updating banner URLs in the database
  - `get_banner_urls` - For retrieving banner URLs (works for anonymous users)

### 2. Create the Storage Bucket

Next, you need to ensure the "banners" storage bucket exists with proper permissions:

#### Option 1: Use the provided script

1. Edit `create-banners-bucket.js` to add your Supabase credentials
2. Run the script with:
   ```
   npm install @supabase/supabase-js
   node create-banners-bucket.js
   ```

#### Option 2: Create it manually in the Supabase dashboard

1. Log in to your Supabase dashboard
2. Navigate to Storage
3. Click "New Bucket"
4. Name it "banners"
5. Check the "Public bucket" option to make the files publicly accessible
6. Click "Create bucket"

### 3. Test the Functionality

Test if everything is working with the test script:

1. Edit `test-banner-functions.js` to add your Supabase URL and anon key
2. Run the script:
   ```
   node test-banner-functions.js
   ```
3. Verify that all the tests pass, especially:
   - RPC function calls for `get_banner_urls`
   - Storage bucket access

### 4. Deploy and Restart Your Application

1. Commit your changes
2. Push to your repository
3. Trigger a new deployment on Vercel (or your hosting platform)
4. Wait for the build to complete
5. Test the login page as both an authenticated user and a guest

## Troubleshooting

If you're still experiencing issues:

1. **Check console logs**: Look for any errors in the browser console while loading the login page
2. **Verify URLs**: Check if the banner URLs in the database point to valid images
3. **Check RLS policies**: Make sure the `site_settings` table has the correct RLS policies
4. **Test SQL functions**: Try calling the RPC functions directly in Supabase Studio
5. **Storage permissions**: Ensure the banners bucket is publicly accessible

## Files Included

- `fix-banner-functions.sql` - SQL script to create tables, policies, and functions
- `create-banners-bucket.js` - Script to create the storage bucket
- `test-banner-functions.js` - Test script to verify functionality

## Technical Details

### RLS Policies

The script creates the following RLS policies:

1. `Anyone can read settings` - Allows all users to read from `site_settings`
2. `Authenticated users can manage settings` - Allows authenticated users to modify settings

### SQL Functions

1. `update_site_setting(key TEXT, value TEXT)` - Updates a setting, bypassing RLS
2. `get_banner_urls()` - Returns a JSON object with banner URLs, accessible to all users

### LocalStorage Fallback

The application code already includes logic to fall back to localStorage values if database fetching fails, ensuring a better user experience. 