// ADMIN ACCESS FIX SCRIPT
// Copy this entire script and paste it into your browser console
// while logged in to your account at http://localhost:5173/login

(async function() {
  try {
    // Get the supabase client from the window object
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    console.log('Attempting admin fix with available configuration...');
    
    // First try: direct database access
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      
      if (!user) {
        console.error('ERROR: Not logged in. Please log in first.');
        return;
      }
      
      console.log('Current user:', user.email);
      
      // Try to set is_admin directly
      const res = await window.supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);
        
      if (res.error) {
        throw new Error(res.error.message);
      }
      
      console.log('SUCCESS! Your account should now have admin privileges.');
      console.log('Please sign out and sign back in to refresh your session.');
      console.log('Then try accessing /admin');
      
    } catch (err) {
      console.error('Direct database update failed:', err.message);
      console.log('Trying alternative method...');
      
      // Create a temporary admin profile for the email
      const res = await window.supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', 'contact.strodano@gmail.com');
      
      if (res.error) {
        throw new Error(res.error.message);
      }
      
      console.log('SUCCESS! Account contact.strodano@gmail.com should now have admin privileges.');
      console.log('Please sign out and sign back in to refresh your session.');
    }
  } catch (error) {
    console.error('ERROR:', error.message);
    console.log('Try accessing the debug admin page at /debug-admin instead');
  }
})(); 