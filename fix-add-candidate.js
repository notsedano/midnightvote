// =====================================================
// COPY AND PASTE THIS ENTIRE SCRIPT INTO YOUR BROWSER CONSOLE
// ON THE /admin or /debug-admin PAGE TO ADD CANDIDATES DIRECTLY
// =====================================================

(async function() {
  // Direct candidate add function that works around policy issues
  async function addCandidate(name, genre) {
    try {
      console.log(`Attempting to add candidate: ${name} (${genre})...`);
      
      // Use the window.supabase client that's already authenticated
      const supabase = window.supabase;
      
      if (!supabase) {
        throw new Error('Supabase client not found. Make sure you run this on the admin page.');
      }
      
      // First approach - basic insert
      let result = await supabase.from('candidates').insert({
        name: name,
        genre: genre,
        created_at: new Date().toISOString()
      });
      
      if (result.error) {
        console.log('Basic insert failed, trying alternative method...');
        
        // Try direct RPC if available
        try {
          result = await supabase.rpc('add_candidate_direct', {
            candidate_name: name,
            candidate_genre: genre
          });
        } catch (rpcErr) {
          console.log('RPC method not available:', rpcErr);
        }
        
        if (result.error) {
          // Last resort - minimal insert
          result = await supabase.from('candidates').insert({
            name: name,
            genre: genre
          });
          
          if (result.error) throw result.error;
        }
      }
      
      console.log('SUCCESS! Candidate added. Please refresh the admin page.');
      return true;
    } catch (error) {
      console.error('Failed to add candidate:', error);
      return false;
    }
  }
  
  // Create a simple UI for adding candidates
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '80px';
  container.style.right = '20px';
  container.style.backgroundColor = '#1a1a1a';
  container.style.padding = '15px';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
  container.style.zIndex = '9999';
  container.style.width = '300px';
  
  container.innerHTML = `
    <h3 style="color:#a78bfa;margin-top:0;margin-bottom:10px;font-size:16px">Direct Candidate Add</h3>
    <div style="margin-bottom:10px">
      <input id="direct-name" placeholder="DJ Name" style="width:100%;padding:8px;background:#2a2a2a;border:1px solid #3a3a3a;color:white;border-radius:4px;margin-bottom:8px">
      <input id="direct-genre" placeholder="Genre" style="width:100%;padding:8px;background:#2a2a2a;border:1px solid #3a3a3a;color:white;border-radius:4px">
    </div>
    <button id="direct-add-btn" style="background:#a78bfa;color:white;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;width:100%">Add Candidate</button>
    <div id="direct-status" style="margin-top:8px;font-size:12px;color:#8b8b8b"></div>
  `;
  
  document.body.appendChild(container);
  
  document.getElementById('direct-add-btn').addEventListener('click', async () => {
    const name = document.getElementById('direct-name').value;
    const genre = document.getElementById('direct-genre').value;
    
    if (!name || !genre) {
      document.getElementById('direct-status').innerText = 'Name and genre are required!';
      document.getElementById('direct-status').style.color = '#f87171';
      return;
    }
    
    document.getElementById('direct-status').innerText = 'Adding candidate...';
    document.getElementById('direct-status').style.color = '#8b8b8b';
    
    const success = await addCandidate(name, genre);
    
    if (success) {
      document.getElementById('direct-status').innerText = 'Success! Candidate added.';
      document.getElementById('direct-status').style.color = '#10b981';
      document.getElementById('direct-name').value = '';
      document.getElementById('direct-genre').value = '';
    } else {
      document.getElementById('direct-status').innerText = 'Failed to add candidate. Check console.';
      document.getElementById('direct-status').style.color = '#f87171';
    }
  });
  
  console.log('Candidate add helper is ready! Use the form in the bottom right corner.');
})(); 