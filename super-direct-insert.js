// ===========================================================
// EMERGENCY CANDIDATE INSERT - COPY THIS ENTIRE SCRIPT
// Paste into browser console on the admin or debug page
// ===========================================================

(async function() {
  // Create minimal UI
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.left = '50%';
  container.style.transform = 'translateX(-50%)';
  container.style.zIndex = '10000';
  container.style.background = '#111';
  container.style.border = '2px solid #a855f7';
  container.style.borderRadius = '8px';
  container.style.padding = '15px';
  container.style.width = '350px';
  container.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
  
  container.innerHTML = `
    <h2 style="color:#a855f7;margin:0 0 15px 0;font-size:18px;text-align:center">🚨 EMERGENCY CANDIDATE INSERT 🚨</h2>
    <div style="margin-bottom:10px">
      <label style="display:block;color:#ccc;margin-bottom:4px;font-size:13px">DJ Name</label>
      <input id="emergency-name" style="display:block;width:100%;background:#222;border:1px solid #444;color:white;padding:8px;border-radius:4px">
    </div>
    <div style="margin-bottom:15px">
      <label style="display:block;color:#ccc;margin-bottom:4px;font-size:13px">Music Genre</label>
      <input id="emergency-genre" style="display:block;width:100%;background:#222;border:1px solid #444;color:white;padding:8px;border-radius:4px">
    </div>
    <button id="emergency-submit" style="background:#a855f7;color:white;border:none;width:100%;padding:10px;border-radius:4px;font-weight:bold;cursor:pointer">ADD CANDIDATE</button>
    <div id="emergency-status" style="margin-top:10px;font-size:13px;color:#888;text-align:center"></div>
    <button id="emergency-close" style="position:absolute;top:8px;right:8px;background:none;border:none;color:#888;cursor:pointer;font-size:18px">&times;</button>
  `;
  
  document.body.appendChild(container);
  
  // Close button handler
  document.getElementById('emergency-close').addEventListener('click', () => {
    container.remove();
  });
  
  // Submit button handler
  document.getElementById('emergency-submit').addEventListener('click', async () => {
    const name = document.getElementById('emergency-name').value.trim();
    const genre = document.getElementById('emergency-genre').value.trim();
    const status = document.getElementById('emergency-status');
    
    if (!name || !genre) {
      status.textContent = 'Name and genre are required!';
      status.style.color = '#f87171';
      return;
    }
    
    status.textContent = 'Attempting to add candidate...';
    status.style.color = '#888';
    
    try {
      console.log('Emergency insert for:', name, genre);
      
      // APPROACH 1: Direct insert
      try {
        const supabase = window.supabase;
        const result = await supabase.from('candidates').insert({
          name,
          genre,
          created_at: new Date().toISOString()
        });
        
        console.log('Result:', result);
        
        if (result.error) throw new Error(result.error.message);
        
        status.textContent = 'SUCCESS! Candidate added.';
        status.style.color = '#4ade80';
        document.getElementById('emergency-name').value = '';
        document.getElementById('emergency-genre').value = '';
        return;
      } catch (err) {
        console.error('Approach 1 failed:', err);
      }
      
      // APPROACH 2: Use raw SQL (requires admin privileges)
      try {
        console.log('Trying approach 2 - raw SQL...');
        
        const result = await window.supabase.rpc('emergency_insert_candidate', {
          p_name: name,
          p_genre: genre
        });
        
        console.log('RPC result:', result);
        
        if (result.error) throw new Error(result.error.message);
        
        status.textContent = 'SUCCESS with approach 2! Candidate added.';
        status.style.color = '#4ade80';
        document.getElementById('emergency-name').value = '';
        document.getElementById('emergency-genre').value = '';
        return;
      } catch (err) {
        console.error('Approach 2 failed:', err);
      }
      
      status.textContent = 'All approaches failed. Check console for details.';
      status.style.color = '#f87171';
      
    } catch (error) {
      console.error('Emergency insert failed:', error);
      status.textContent = `Error: ${error.message}`;
      status.style.color = '#f87171';
    }
  });
})(); 