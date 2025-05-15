# Deployment Guide for Midnight Rebels DJ Voting App

## Latest Deployment URL
The latest production deployment of the application is available at:
https://midnight-dj-vote-og5mrn0vr-notsedanos-projects.vercel.app

## Access the Admin Panel
1. Navigate to `/admin` on the deployment URL
2. Login with your admin credentials
3. You should now see the Admin Panel with the banner management tools at the bottom

## Banner Management
The application now supports two ways to manage banners:

### External Banner URLs (Recommended)
1. Go to the Admin Panel (`/admin`)
2. Scroll down to "Banner Management" section
3. Use the "External Banner URL Manager" to add URLs to images hosted elsewhere
4. Input the full URL to an image (e.g. from Imgur, Cloudinary, or any site that allows hotlinking)
5. Click "Save" to apply the banner

### Testing Banners
1. Visit `/test-banner` to see all current banners and test new ones
2. You can quickly test any image URL to see if it works correctly
3. Sample URLs are provided for testing purposes

## Manual Deployment Steps
If you need to deploy the application manually:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the "midnight-dj-vote" project
3. Click on "Deployments" tab
4. Click the "Deploy" button
5. Select the branch you want to deploy (usually 'main')

## Troubleshooting Banner Upload Issues
If you encounter issues with banners:

1. Try using an external image URL instead of uploading directly
2. Make sure the image URL is publicly accessible
3. Visit the `/test-banner` path for troubleshooting
4. Check your browser console for detailed error messages

The app now uses a simple localStorage-based system for banners, which is more reliable than the previous database-based approach. For a more permanent solution, run the SQL in `create-settings-table.sql` in your Supabase SQL editor. 