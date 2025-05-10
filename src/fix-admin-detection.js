// Admin detection fix script
// Run this in your browser console when logged in as contact.strodano@gmail.com

(async function() {
  try {
    console.log("🔍 Starting admin detection diagnostic...");
    
    // 1. Get Supabase client
    const supabase = window.supabase;
    if (!supabase) {
      throw new Error("Could not access Supabase client. Make sure you're on the app page.");
    }
    
    // 2. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    if (!user) throw new Error("No user is logged in. Please log in first.");
    
    console.log(`👤 Current user: ${user.email} (ID: ${user.id})`);
    
    // 3. Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error("❌ Error fetching profile:", profileError.message);
      
      // 3.1 If profile doesn't exist, try to create it
      if (profileError.code === 'PGRST116') {
        console.log("⚠️ Profile not found. Attempting to create profile...");
        
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            is_admin: true,
            created_at: new Date().toISOString()
          });
          
        if (createError) {
          throw new Error(`Failed to create profile: ${createError.message}`);
        }
        
        console.log("✅ Profile created successfully with admin privileges!");
      }
    } else {
      console.log("📋 Current profile:", profile);
      
      // 4. Check admin status
      if (profile.is_admin) {
        console.log("✅ User is already an admin in the database");
      } else {
        console.log("⚠️ User is not an admin. Attempting to grant admin privileges...");
        
        // 5. Grant admin privileges
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', user.id);
          
        if (updateError) {
          throw new Error(`Failed to update admin status: ${updateError.message}`);
        }
        
        console.log("🎉 Admin privileges granted successfully!");
      }
    }
    
    // 6. Special fix for contact.strodano@gmail.com
    if (user.email === 'contact.strodano@gmail.com') {
      console.log("🔧 Applying special fix for contact.strodano@gmail.com...");
      
      // Try direct update by email
      const { error: specificError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', 'contact.strodano@gmail.com');
        
      if (specificError) {
        console.warn(`Warning: ${specificError.message}`);
      } else {
        console.log("✅ Special fix applied!");
      }
    }
    
    console.log("📣 NEXT STEPS:");
    console.log("1. Sign out");
    console.log("2. Sign back in");
    console.log("3. Try accessing /admin");
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.log("Try the debug page at /debug-admin as a workaround");
  }
})(); 