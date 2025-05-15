# Deployment Guide for Midnight Rebels DJ Voting App

## Latest Deployment URL
The latest production deployment of the application is available at:
https://midnight-dj-vote-og5mrn0vr-notsedanos-projects.vercel.app

## Access the Admin Panel
1. Navigate to `/admin` on the deployment URL
2. Login with your admin credentials
3. You should now see the Admin Panel with the banner upload feature at the bottom

## Manual Deployment Steps
If you need to deploy the application manually:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the "midnight-dj-vote" project
3. Click on "Deployments" tab
4. Click the "Deploy" button
5. Select the branch you want to deploy (usually 'main')

## Troubleshooting Banner Upload Issues
If you encounter "Bucket not found" errors:

1. Make sure you've created the 'banners' bucket in your Supabase dashboard
2. Visit the `/test-bucket` path on the deployment URL to diagnose issues
3. Check your browser console for detailed error messages

The app has been updated to work without requiring the site_settings table in the database, using localStorage instead. For a more permanent solution, run the SQL in `create-settings-table.sql` in your Supabase SQL editor. 