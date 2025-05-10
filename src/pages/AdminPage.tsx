import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { Trash2, RefreshCw, PlusCircle, BarChart2, Users, Award, Terminal } from 'lucide-react';
import VoteChart from '../components/VoteChart';
import { supabase } from '../lib/supabase';

const AdminPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { candidates, fetchCandidates, isLoading, voteCounts } = useVoting();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [voterCount, setVoterCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Get voter count
  useEffect(() => {
    const fetchVoterCount = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('has_voted', true);
          
        if (error) throw error;
        if (data) setVoterCount(data.length);
      } catch (error) {
        console.error('Error fetching voter count:', error);
      }
    };
    
    fetchVoterCount();
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCandidates();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const handleDeleteCandidate = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this candidate?');
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      setError('Failed to delete candidate');
    }
  };
  
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('candidates')
        .insert([{ name: newCandidateName }]);
        
      if (error) throw error;
      setNewCandidateName('');
      setShowAddCandidate(false);
      fetchCandidates();
    } catch (error) {
      console.error('Error adding candidate:', error);
      setError('Failed to add candidate');
    }
  };
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-4">
        <Terminal size={48} className="text-[#9ACD32] mb-4" />
        <div className="font-mono text-[#9ACD32] text-xl mb-2">ACCESS DENIED</div>
        <p className="text-gray-400 max-w-md text-center font-mono">
          Unauthorized access attempt logged. This incident will be reported.
        </p>
      </div>
    );
  }

  // Calculate total votes
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-black font-mono pb-20">
      <Banner 
        title="ADMIN CONTROL PANEL" 
        subtitle="SYSTEM MANAGEMENT INTERFACE"
      />
      
      <div className="container mx-auto px-4 py-2">
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-300 rounded-md flex items-center">
            <span className="mr-2">ERROR:</span> {error}
            <button 
              className="ml-auto text-red-300 hover:text-red-100"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">CANDIDATES</span>
              <Award size={18} className="text-[#9ACD32]" />
            </div>
            <div className="text-2xl text-[#9ACD32]">{candidates.length}</div>
          </div>
          
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">VOTERS</span>
              <Users size={18} className="text-[#9ACD32]" />
            </div>
            <div className="text-2xl text-[#9ACD32]">{voterCount}</div>
          </div>
          
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">TOTAL VOTES</span>
              <BarChart2 size={18} className="text-[#9ACD32]" />
            </div>
            <div className="text-2xl text-[#9ACD32]">{totalVotes}</div>
          </div>
        </div>
        
        {/* Vote Distribution */}
        <div className="mb-6 p-4 bg-black border border-[#9ACD32]/30 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-[#9ACD32]">Vote Distribution</h2>
            <button 
              onClick={handleRefresh}
              className="text-[#9ACD32] hover:text-white transition duration-200"
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="h-64">
            <VoteChart candidates={candidates} voteCounts={voteCounts} />
          </div>
        </div>
        
        {/* Candidate Management */}
        <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-[#9ACD32]">Candidate Management</h2>
            <button 
              onClick={() => setShowAddCandidate(!showAddCandidate)}
              className="flex items-center text-sm bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-3 py-1 rounded hover:bg-[#9ACD32]/20 transition duration-200"
            >
              <PlusCircle size={14} className="mr-1" />
              {showAddCandidate ? 'Cancel' : 'Add DJ'}
            </button>
          </div>
          
          {showAddCandidate && (
            <form onSubmit={handleAddCandidate} className="mb-4 p-3 bg-black border border-[#9ACD32]/30 rounded-md">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  placeholder="Enter DJ name"
                  className="flex-1 bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-md focus:outline-none focus:border-[#9ACD32]"
                />
                <button 
                  type="submit" 
                  className="ml-2 bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-4 py-2 rounded hover:bg-[#9ACD32]/20 transition duration-200"
                  disabled={!newCandidateName.trim()}
                >
                  Add
                </button>
              </div>
            </form>
          )}
          
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <div 
                key={candidate.id}
                className="p-3 bg-black border border-[#9ACD32]/30 rounded-md flex justify-between items-center"
              >
                <div>
                  <div className="text-white">{candidate.name}</div>
                  <div className="text-xs text-gray-400">Votes: {voteCounts[candidate.id] || 0}</div>
                </div>
                <button 
                  onClick={() => handleDeleteCandidate(candidate.id)}
                  className="text-red-400 hover:text-red-300 transition duration-200"
                  aria-label="Delete candidate"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            {candidates.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                No candidates found. Add a DJ to get started.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default AdminPage;