# Vercel Deployment Guide

This guide will help you deploy your DJ voting application to Vercel.

## Environment Variables

Before deploying, you'll need to set up the following environment variables in Vercel:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous API key

You can find these values in your Supabase dashboard or your local .env file.

## Deployment Steps

1. You've already installed Vercel CLI and logged in
2. Run the deployment command:
   ```
   vercel
   ```

3. When prompted, follow these steps:
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: Accept default or choose a name
   - Directory: `.`
   - Want to override settings: `Y`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Development command: `npm run dev`
   - Want to modify these settings: `N`

4. When deployment completes, Vercel will provide a URL for your application.

## Environment Variable Setup in Vercel Dashboard

After deployment, go to your Vercel dashboard:

1. Select your project
2. Go to "Settings" tab
3. Click on "Environment Variables"
4. Add the two variables mentioned above
5. Save and trigger a redeployment

## CORS Configuration in Supabase

Important: After deployment, you need to update your Supabase project to allow requests from your Vercel domain:

1. Go to your Supabase dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Vercel URL to the "Site URL" and "Redirect URLs" fields
4. Save changes

This ensures your application can communicate with Supabase from the Vercel domain. 