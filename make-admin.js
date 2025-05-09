// Script to make a user an admin in Supabase
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and service role key
// You can find these in your Supabase dashboard settings
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check for required env variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

// The email of the user you want to make an admin
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Error: Please provide a user email as an argument');
  console.log('Usage: node make-admin.js user@example.com');
  process.exit(1);
}

// Create a Supabase client with the service role key (has admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin() {
  try {
    // First, find the user by email
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .limit(1);

    if (userError) {
      throw new Error(`Error finding user: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      throw new Error(`No user found with email: ${userEmail}`);
    }

    const userId = users[0].id;

    // Update the user's profile to set is_admin to true
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Error updating user: ${updateError.message}`);
    }

    console.log(`Successfully made user ${userEmail} an admin!`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeUserAdmin(); 