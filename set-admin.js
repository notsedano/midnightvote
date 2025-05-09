// This is a script you can run in the browser console to make your user an admin
// First, copy-paste this entire script into your browser's console on the app page
// Then run it to make your current user an admin

async function makeCurrentUserAdmin() {
  try {
    // Import the supabase client from the app
    // This assumes the supabase client is accessible via window.supabase or similar
    // You might need to modify this based on how the app is structured
    const supabase = window.supabase;
    
    if (!supabase) {
      throw new Error("Couldn't access Supabase client. Make sure you're on the app page.");
    }
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("No user is currently logged in. Please log in first.");
    }
    
    console.log("Current user:", user.email);
    
    // Update the profile to set is_admin = true
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id);
    
    if (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }
    
    console.log("Success! You are now an admin. Please refresh the page.");
    console.log("You should now be able to access the admin page.");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the function
makeCurrentUserAdmin(); 