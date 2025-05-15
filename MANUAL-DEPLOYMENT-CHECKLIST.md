# Manual Deployment Checklist

This checklist provides manual steps to deploy the banner fix, without relying on the automated scripts.

## 1. SQL Database Setup

- Log in to your Supabase dashboard
- Go to the SQL Editor
- Copy and paste the contents of `fix-banner-functions.sql`
- Run the script
- Verify in the Table Editor that the `site_settings` table exists with columns:
  - `id`
  - `key`
  - `value`
  - `created_at`
  - `updated_at`

## 2. Storage Bucket Creation

- Log in to your Supabase dashboard
- Go to Storage
- Click "Create new bucket"
- Name: `banners`
- Check "Public bucket" option
- Click "Create bucket"
- Verify that the bucket appears in your bucket list

## 3. Check RLS Policies

- Go to Authentication > Policies
- Find the `site_settings` table
- Verify these policies exist:
  - "Anyone can read settings" (FOR SELECT)
  - "Authenticated users can manage settings" (FOR ALL)
- If any are missing, create them with the appropriate permissions

## 4. Check Functions

- Go to Database > Functions
- Verify these functions exist:
  - `get_banner_urls()`
  - `update_site_setting(text, text)`
- If missing, run the SQL script again

## 5. Frontend Deployment

- Ensure your application is pointing to the correct Supabase project
- Deploy your application to your hosting provider:
  ```
  git push
  ```
- Wait for the deployment to complete
- Access your application's URL

## 6. Verification

- Visit the login page as an anonymous user
- Check that banners appear (if previously uploaded)
- Log in as an admin
- Go to the admin panel
- Upload new banner images
- Return to the login page as an anonymous user
- Verify that the newly uploaded images appear

## Troubleshooting

If issues persist after completing all steps:

1. Check your browser console for errors while loading the login page
2. Verify that the banner URLs in the `site_settings` table are valid and accessible
3. Test the banner loading with:
   - Incognito/private browsing
   - Different browsers
   - Clearing browser cache

## Key SQL Commands

If you need to manually check or update values:

```sql
-- View current banner settings
SELECT * FROM site_settings WHERE key LIKE 'login_banner%';

-- Test the get_banner_urls function
SELECT get_banner_urls();

-- Manually update a banner URL
SELECT update_site_setting('login_banner1', 'https://your-storage-url/banners/image.jpg');
``` 