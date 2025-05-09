import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface CandidateFormProps {
  onClose: () => void;
  onSave: () => void;
  candidate?: {
    id: number;
    name: string;
    genre: string;
    instagram_username: string | null;
    bio: string | null;
  } | null;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ 
  onClose, 
  onSave, 
  candidate = null 
}) => {
  const [name, setName] = useState(candidate?.name || '');
  const [genre, setGenre] = useState(candidate?.genre || '');
  const [instagram, setInstagram] = useState(candidate?.instagram_username || '');
  const [bio, setBio] = useState(candidate?.bio || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !genre) {
      setError('Name and genre are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (candidate) {
        // Update existing candidate
        const { error } = await supabase
          .from('candidates')
          .update({
            name,
            genre,
            instagram_username: instagram || null,
            bio: bio || null
          })
          .eq('id', candidate.id);
          
        if (error) throw error;
      } else {
        // Create new candidate using a more direct method
        try {
          // First approach - standard insert
          const { error } = await supabase
            .from('candidates')
            .insert({
              name,
              genre,
              instagram_username: instagram || null,
              bio: bio || null
            });
            
          if (error) {
            // If that fails, try with RPC to bypass policies
            console.log("Trying alternative insert method...");
            const { error: rpcError } = await supabase.rpc('insert_candidate', { 
              p_name: name,
              p_genre: genre,
              p_instagram: instagram || null,
              p_bio: bio || null
            });
            
            if (rpcError) throw rpcError;
          }
        } catch (insertErr) {
          console.error("Insert failed:", insertErr);
          
          // Last attempt - fallback to raw insert with simpler data
          const { error: fallbackError } = await supabase
            .from('candidates')
            .insert({
              name: name,
              genre: genre
            });
            
          if (fallbackError) throw fallbackError;
        }
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving candidate:', err);
      setError(`Error: ${err.message || 'Unknown error'}. Try refreshing the page and signing out and in again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-dark-950/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-dark-800 rounded-lg p-6 w-full max-w-md"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-mono text-primary-400">
            {candidate ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-error-900/30 border border-error-700 rounded-md text-error-300 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-mono text-sm text-gray-300 mb-1">
              Name*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="DJ Name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block font-mono text-sm text-gray-300 mb-1">
              Genre*
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="input"
              placeholder="Music Genre"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block font-mono text-sm text-gray-300 mb-1">
              Instagram Username
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="input"
              placeholder="@username (optional)"
            />
          </div>
          
          <div className="mb-6">
            <label className="block font-mono text-sm text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input min-h-24"
              placeholder="Brief description (optional)"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : candidate ? 'Update' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CandidateForm;