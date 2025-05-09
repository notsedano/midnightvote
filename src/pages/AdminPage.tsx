import React, { useState } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import VoteChart from '../components/VoteChart';
import CandidateForm from '../components/CandidateForm';
import LoadingScreen from '../components/LoadingScreen';
import SimpleCandidateForm from '../components/SimpleCandidateForm';
import { supabase } from '../lib/supabase';
import { PlusCircle, RefreshCw, Pencil, Trash2 } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { candidates, voteCounts, totalVotes, isLoading, fetchCandidates } = useVoting();
  const { user } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [voterCount, setVoterCount] = useState<number>(0);
  const [showSimpleForm, setShowSimpleForm] = useState(false);
  
  // Fetch voter count on mount
  React.useEffect(() => {
    const fetchVoterCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('has_voted', true);
      
      if (!error && count !== null) {
        setVoterCount(count);
      }
    };
    
    fetchVoterCount();
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCandidates();
    
    // Update voter count
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('has_voted', true);
    
    if (count !== null) {
      setVoterCount(count);
    }
    
    setTimeout(() => setRefreshing(false), 500);
  };
  
  const handleDeleteCandidate = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(id);
    
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchCandidates();
    } catch (err) {
      console.error('Error deleting candidate:', err);
      alert('Failed to delete candidate. Please try again.');
    } finally {
      setDeleting(null);
    }
  };
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <Banner 
        imageUrl="https://images.pexels.com/photos/4709285/pexels-photo-4709285.jpeg?auto=compress&cs=tinysrgb&w=800"
        title="Admin Dashboard"
      />
      
      <div className="container mx-auto px-4">
        <div className="flex justify-end mb-6">
          <button 
            onClick={handleRefresh}
            className="flex items-center space-x-1 bg-dark-800 hover:bg-dark-700 py-2 px-3 rounded-md text-sm mr-2"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={`text-primary-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-dark-800">
            <p className="text-sm text-gray-400 mb-1">Total Candidates</p>
            <p className="text-2xl font-mono text-primary-400">{candidates.length}</p>
          </div>
          
          <div className="card bg-dark-800">
            <p className="text-sm text-gray-400 mb-1">Total Voters</p>
            <p className="text-2xl font-mono text-primary-400">{voterCount}</p>
          </div>
          
          <div className="card bg-dark-800">
            <p className="text-sm text-gray-400 mb-1">Total Votes</p>
            <p className="text-2xl font-mono text-primary-400">{totalVotes}</p>
          </div>
        </div>
        
        {/* Vote Chart */}
        <div className="card mb-6">
          <h2 className="text-lg font-mono text-primary-400 mb-4">Vote Distribution</h2>
          <VoteChart candidates={candidates} voteCounts={voteCounts} />
        </div>
        
        {/* Simple Form Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowSimpleForm(!showSimpleForm)}
            className="text-primary-400 hover:text-primary-300 text-sm underline"
          >
            {showSimpleForm ? 'Hide' : 'Show'} Simple Add Form
          </button>
          
          {showSimpleForm && (
            <div className="mt-4">
              <SimpleCandidateForm />
            </div>
          )}
        </div>
        
        {/* Candidate Management */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-mono text-primary-400">Candidate List</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary flex items-center space-x-1"
            >
              <PlusCircle size={16} />
              <span>Add Candidate</span>
            </button>
          </div>
          
          {candidates.length > 0 ? (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <div 
                  key={candidate.id} 
                  className="flex justify-between items-center p-3 bg-dark-900 rounded-md"
                >
                  <div>
                    <p className="font-mono text-primary-400">{candidate.name}</p>
                    <p className="text-sm text-gray-400">{candidate.genre}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingCandidate(candidate)}
                      className="p-2 bg-dark-800 hover:bg-dark-700 rounded-md"
                    >
                      <Pencil size={16} className="text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      className="p-2 bg-dark-800 hover:bg-error-900 rounded-md"
                      disabled={deleting === candidate.id}
                    >
                      <Trash2 size={16} className={`${deleting === candidate.id ? 'text-gray-600' : 'text-error-400'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No candidates yet. Click "Add Candidate" to create one.</p>
          )}
        </div>
      </div>
      
      {/* Candidate Forms */}
      {showAddForm && (
        <CandidateForm 
          onClose={() => setShowAddForm(false)} 
          onSave={fetchCandidates} 
        />
      )}
      
      {editingCandidate && (
        <CandidateForm 
          candidate={editingCandidate}
          onClose={() => setEditingCandidate(null)} 
          onSave={fetchCandidates} 
        />
      )}
      
      <Navigation />
    </div>
  );
};

export default AdminPage;