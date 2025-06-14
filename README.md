# Midnight Rebels DJ Voting Application

A voting application for DJ/Producer competitions.

## Setup Instructions

### 1. Supabase Configuration

#### Create a Supabase Storage Bucket
For the banner upload functionality to work, you need to create a storage bucket named 'banners' in your Supabase project.

**Option 1: Using the provided script**
1. Edit `scripts/create-banners-bucket.js` with your Supabase URL and Service Role Key
2. Run: `node scripts/create-banners-bucket.js`

**Option 2: Manual creation via Supabase Dashboard**
1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to Storage > Buckets
3. Click "New Bucket"
4. Enter "banners" as the bucket name
5. Enable "Public bucket" option
6. Create RLS policies as needed for your security requirements

### 2. Environment Variables

Create a `.env` file in the project root with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```
npm install
```

### 4. Run Development Server

```
npm run dev
```

## Features

- User authentication
- DJ candidate voting system
- Admin dashboard for candidate management
- Banner image upload
- Vote tallying and statistics
- Mobile-optimized interface

## Admin Features

- Create, edit, and delete DJ candidates
- View real-time vote statistics
- Upload banners for the login/register pages
- Track IP addresses and voting patterns

## Environment Setup

This application requires environment variables to connect to Supabase:

### Supabase URL Formats

The Supabase URL can be entered in several formats:
- Project ID only: `abcdefghijklm`
- Full domain: `abcdefghijklm.supabase.co`
- Full URL: `https://abcdefghijklm.supabase.co`

Our application will automatically format the URL correctly.

### Setting Up Environment Variables

#### Local Development

1. Create a `.env.local` file in the root directory
2. Add the following lines:
```
VITE_SUPABASE_URL=your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
3. Replace with your actual Supabase values

#### Production Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings > Environment Variables
4. Add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables
5. Make sure to apply them to Production, Preview, and Development environments

### Supabase Configuration

1. In Supabase Dashboard, go to Authentication → URL Configuration
2. Add your Vercel domain to both "Site URL" and "Redirect URLs"
3. Click Save

## Troubleshooting

### Connection Issues

If experiencing "Failed to fetch" errors:
1. Check that Supabase URL is correct
2. Verify your API key is valid
3. Ensure Supabase CORS settings include your domain

### Testing Connection

You can test your Supabase connection using our test page:
- Visit `/login-test.html` on your deployed site
- Enter your credentials and Supabase information
- Try both login methods to diagnose issues

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

```bash
# Deploy to Vercel
vercel --prod
```
