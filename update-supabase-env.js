/**
 * Local Environment Variables Update Script
 * 
 * Instructions:
 * 1. Edit the .env.local file with the correct values
 * 2. Run this script to update your environment variables
 * 3. This script does NOT affect Vercel environment variables
 */

const fs = require('fs');
const path = require('path');

// Create .env.local file if it doesn't exist
const envFilePath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envFilePath)) {
  const defaultEnv = `# Update these values and run node update-supabase-env.js
VITE_SUPABASE_URL=your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`;
  
  fs.writeFileSync(envFilePath, defaultEnv);
  console.log(`Created ${envFilePath} - Please update with your correct values and run this script again.`);
  process.exit(0);
}

// Read .env.local file
const envFile = fs.readFileSync(envFilePath, 'utf8');
const envVars = {};

// Parse environment variables
envFile.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

// Display the values that will be used
console.log('\nEnvironment Variables:\n');
if (envVars.VITE_SUPABASE_URL) {
  console.log(`VITE_SUPABASE_URL: ${envVars.VITE_SUPABASE_URL}`);
} else {
  console.log('Warning: VITE_SUPABASE_URL is not set!');
}

if (envVars.VITE_SUPABASE_ANON_KEY) {
  console.log(`VITE_SUPABASE_ANON_KEY: ${envVars.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...`);
} else {
  console.log('Warning: VITE_SUPABASE_ANON_KEY is not set!');
}

console.log('\nImportant: These values are only applied locally.');
console.log('For production, you must set environment variables in the Vercel dashboard.');
console.log('Instructions:');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > Environment Variables');
console.log('4. Add or update the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables');
console.log('\nThank you for updating your environment variables!'); 