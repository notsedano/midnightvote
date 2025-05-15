# Banner Fix Deployment Instructions

## Overview

This document provides step-by-step instructions to deploy the banner fix that addresses the issue of banner images not appearing for anonymous users on the login page.

## Prerequisites

- Access to your Supabase project's dashboard
- Supabase Service Role key
- Supabase URL
- Git access to the repository

## Deployment Steps

### 1. Configure Credentials

Create a `test-config.js` file with your Supabase credentials:

```javascript
export const SUPABASE_URL = "your-project-id.supabase.co";
export const SUPABASE_ANON_KEY = "your-anon-key";
export const SUPABASE_SERVICE_KEY = "your-service-role-key";
```

### 2. Set Up Supabase Database Tables and Functions

Run the SQL script in Supabase:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `fix-banner-functions.sql` 
4. Run the SQL script to create:
   - The `site_settings` table
   - The `update_site_setting` function
   - The `get_banner_urls` function
   - RLS policies for proper access

### 3. Create the Banners Storage Bucket

Run the bucket creation script:

```bash
npm run create-bucket
```

This will create a public storage bucket named "banners" in your Supabase project.

### 4. Test the Functionality

Verify that the banner functions work correctly:

```bash
npm run test-banners
```

Make sure that:
- The `get_banner_urls` function works
- The `update_site_setting` function works
- The storage bucket is accessible

### 5. Deploy the Application

Push your changes to your repository and trigger a deployment on your hosting platform (e.g., Vercel):

```bash
git push
```

Or use the automated deployment script:

```bash
npm run fix-banners
```

### 6. Verify on Production

1. Visit your login page as an anonymous user
2. Check that banner images are visible
3. Log in as an admin and upload new banner images
4. Verify that the new images appear for anonymous users

## Troubleshooting

If issues persist:

1. Check browser console for errors
2. Verify RLS policies in Supabase
3. Ensure SQL functions are properly created
4. Validate storage bucket permissions

## Scripts Reference

The following npm scripts are available:

- `npm run create-bucket` - Creates the banners storage bucket
- `npm run test-banners` - Tests banner functions
- `npm run fix-banners` - Full deployment automation

For more detailed information, refer to `BANNER-FIX-README.md`. 