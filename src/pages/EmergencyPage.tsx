import React, { useState } from 'react';
import Banner from '../components/Banner';
import Navigation from '../components/Navigation';

const EmergencyPage: React.FC = () => {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !genre) {
      setMessage('Name and genre are required');
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    setMessage('');
    
    try {
      // APPROACH 1: Using fetch directly to Supabase API
      const apiUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!apiUrl || !anonKey) {
        throw new Error('Supabase credentials are missing');
      }
      
      // First get the session token
      const auth = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      const accessToken = auth?.currentSession?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated. Please log in first.');
      }
      
      // Make direct API call to RPC function
      const response = await fetch(`${apiUrl}/rest/v1/rpc/emergency_insert_candidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          p_name: name,
          p_genre: genre
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add candidate');
      }
      
      setName('');
      setGenre('');
      setStatus('success');
      setMessage('Candidate added successfully!');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error adding candidate:', err);
      setMessage(`Error: ${err.message || 'Unknown error'}`);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <Banner 
        imageUrl="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800"
        title="Emergency Candidate Management"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="card mb-6">
          <h2 className="text-xl font-mono text-primary-400 mb-4">Direct Candidate Add</h2>
          <p className="text-gray-400 mb-6">This form uses direct API calls to bypass RLS policies.</p>
          
          {status === 'error' && (
            <div className="mb-4 p-3 bg-error-900/30 border border-error-700 rounded-md text-error-300 text-sm">
              {message}
            </div>
          )}
          
          {status === 'success' && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-md text-green-300 text-sm">
              {message}
            </div>
          )}
          
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm mb-1">DJ Name*</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                placeholder="DJ Name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="genre" className="block text-sm mb-1">Music Genre*</label>
              <input
                id="genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="input w-full"
                placeholder="House, Techno, etc."
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Adding...' : 'Add Candidate'}
            </button>
          </form>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-mono text-primary-400 mb-4">Instructions for Database Fix</h2>
          
          <ol className="list-decimal pl-6 space-y-2 text-gray-300">
            <li>Go to the Supabase project dashboard</li>
            <li>Navigate to "Authentication" &gt; "Policies"</li>
            <li>For the "candidates" table, click "Disable RLS"</li>
            <li>This will allow all authenticated users to create candidates</li>
            <li>Alternatively, run the SQL in supabase_sql_function.sql</li>
          </ol>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default EmergencyPage; 