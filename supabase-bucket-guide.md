# Creating a Storage Bucket in Supabase Dashboard

Follow these steps to manually create a storage bucket named "banners" in your Supabase project:

## Step 1: Log in to Supabase Dashboard
Go to https://app.supabase.com and log in to your account.

## Step 2: Select Your Project
Click on the project where you want to create the storage bucket.

## Step 3: Navigate to Storage
In the left sidebar, click on "Storage".

## Step 4: Create a New Bucket
1. Click the "New Bucket" button in the top-right corner.
2. Enter "banners" as the bucket name.
3. Check the "Public bucket" option if you want the files to be publicly accessible.
4. Click "Create bucket".

## Step 5: Set Up Bucket Policies
After creating the bucket, you need to set up access policies:

1. Click on the "banners" bucket to open it.
2. Click on the "Policies" tab.
3. Click "Add Policy" for both INSERT and SELECT operations.
4. For INSERT, you can use the template "Allow authenticated uploads".
5. For SELECT, you can use the template "Allow public access" if you want everyone to be able to view the images.

## Step 6: Verify the Bucket
Ensure that the "banners" bucket appears in your list of buckets.

## Step 7: Test Uploading
Restart your application and try uploading a banner image again. The error should be resolved, and your images should upload successfully to the "banners" bucket. 