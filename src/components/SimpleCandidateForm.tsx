import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const SimpleCandidateForm: React.FC = () => {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !genre) {
      setErrorMessage('Name and genre are required');
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // Simple direct insert with minimal fields
      const { error } = await supabase
        .from('candidates')
        .insert({
          name,
          genre
        });
        
      if (error) throw error;
      
      // Clear form on success
      setName('');
      setGenre('');
      setInstagram('');
      setBio('');
      setStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error adding candidate:', err);
      setErrorMessage(err.message || 'Unknown error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <h2 className="text-xl font-mono text-primary-400 mb-4">Add Candidate (Simple)</h2>
      
      {status === 'error' && (
        <div className="mb-4 p-3 bg-error-900/30 border border-error-700 rounded-md text-error-300 text-sm">
          {errorMessage}
        </div>
      )}
      
      {status === 'success' && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-md text-green-300 text-sm">
          Candidate added successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm mb-1">Name*</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
            placeholder="DJ Name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm mb-1">Genre*</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="input w-full"
            placeholder="Music Genre"
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
  );
};

export default SimpleCandidateForm; 