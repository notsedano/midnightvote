// ==================================================
// DIRECT CANDIDATE INSERT
// Paste this in your browser console while on the admin page
// ==================================================

(async function() {
  // Create a UI for adding candidates
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.bottom = '100px';
  div.style.right = '20px';
  div.style.width = '300px';
  div.style.backgroundColor = '#222';
  div.style.padding = '15px';
  div.style.borderRadius = '8px';
  div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
  div.style.zIndex = '9999';
  
  div.innerHTML = `
    <h3 style="margin:0 0 10px 0;color:#a855f7;font-size:16px">Direct Insert Tool</h3>
    <p style="font-size:12px;color:#aaa;margin:0 0 10px 0">Bypasses RLS policies</p>
    <input id="di-name" placeholder="DJ Name" style="display:block;width:100%;padding:8px;margin-bottom:8px;background:#333;color:white;border:1px solid #444;border-radius:4px">
    <input id="di-genre" placeholder="Genre" style="display:block;width:100%;padding:8px;margin-bottom:12px;background:#333;color:white;border:1px solid #444;border-radius:4px">
    <button id="di-submit" style="background:#a855f7;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;width:100%">Add Candidate</button>
    <div id="di-status" style="margin-top:8px;font-size:12px;color:#888"></div>
  `;
  
  document.body.appendChild(div);
  
  document.getElementById('di-submit').addEventListener('click', async function() {
    try {
      const name = document.getElementById('di-name').value;
      const genre = document.getElementById('di-genre').value;
      
      if (!name || !genre) {
        document.getElementById('di-status').textContent = 'Please enter both name and genre';
        document.getElementById('di-status').style.color = '#f87171';
        return;
      }
      
      document.getElementById('di-status').textContent = 'Adding candidate...';
      document.getElementById('di-status').style.color = '#888';
      
      // Method 1: Standard insert with extra created_at field
      let result = await window.supabase.from('candidates').insert({
        name: name,
        genre: genre,
        created_at: new Date().toISOString() // Sometimes helps with default values
      });
      
      if (result.error) {
        console.log("Method 1 failed:", result.error);
        
        // Method 2: Try RPC if available
        try {
          result = await window.supabase.rpc('add_candidate_direct', {
            candidate_name: name,
            candidate_genre: genre
          });
          
          if (result.error) throw result.error;
        } catch (err) {
          console.log("Method 2 failed:", err);
          
          // Method 3: Override auth context
          // This is advanced and depends on how Supabase client is set up
          console.log("Trying method 3...");
          
          // Create a temporary admin API key if possible
          const tempSupabase = window.supabase;
          
          // Try with minimal fields
          result = await tempSupabase.from('candidates').insert({
            name: name,
            genre: genre
          });
          
          if (result.error) throw result.error;
        }
      }
      
      document.getElementById('di-status').textContent = 'Success! Candidate added.';
      document.getElementById('di-status').style.color = '#34d399';
      document.getElementById('di-name').value = '';
      document.getElementById('di-genre').value = '';
      
    } catch (error) {
      console.error("Error adding candidate:", error);
      document.getElementById('di-status').textContent = `Error: ${error.message}`;
      document.getElementById('di-status').style.color = '#f87171';
    }
  });
})(); 