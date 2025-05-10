import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoting } from '../contexts/VotingContext';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { setDebugMode, isDebugModeEnabled } from '../lib/logger';
import { logger } from '../lib/logger';
import { useNavigate } from 'react-router-dom';

const DebugPage: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const { candidates, userVote, fetchCandidates, fetchVotes, castVote } = useVoting();
  const [debugMode, setDebugModeState] = useState(isDebugModeEnabled());
  const [candidateName, setCandidateName] = useState('');
  const [candidateGenre, setCandidateGenre] = useState('');
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<string | null>(null);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const navigate = useNavigate();
  
  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      logger.warn('Non-admin user attempted to access debug page', { 
        component: 'DebugPage',
        data: { userId: user.id }
      });
      navigate('/vote');
    }
  }, [user, isAdmin, navigate]);
  
  // Toggle debug mode
  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    setDebugModeState(newMode);
    logger.info(`Debug mode ${newMode ? 'enabled' : 'disabled'}`);
  };
  
  // Add a new candidate
  const addCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStatus('Adding candidate...');
    
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([
          { name: candidateName, genre: candidateGenre }
        ])
        .select();
        
      if (error) throw error;
      
      setCandidateName('');
      setCandidateGenre('');
      setAddStatus('Candidate added successfully!');
      fetchCandidates();
      
      setTimeout(() => setAddStatus(null), 3000);
    } catch (err: any) {
      setAddStatus(`Error: ${err.message}`);
      logger.error('Failed to add candidate', { component: 'DebugPage', data: err });
    }
  };
  
  // Reset user vote (for testing)
  const resetVote = async () => {
    if (!user) return;
    
    try {
      // Delete from votes table
      const { error: voteError } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id);
        
      if (voteError) throw voteError;
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_voted: false })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Refresh votes
      await fetchVotes();
      
      alert('Your vote has been reset. You can now vote again.');
    } catch (err: any) {
      alert(`Error resetting vote: ${err.message}`);
      logger.error('Failed to reset vote', { component: 'DebugPage', data: err });
    }
  };
  
  // Test vote for a candidate
  const testVote = async (candidateId: number) => {
    setVoteStatus(`Attempting to vote for candidate ${candidateId}...`);
    
    try {
      const result = await castVote(candidateId);
      
      if (result.success) {
        setVoteStatus('Vote cast successfully!');
      } else {
        setVoteStatus(`Vote failed: ${result.error}`);
      }
      
      setTimeout(() => setVoteStatus(null), 5000);
    } catch (err: any) {
      setVoteStatus(`Error: ${err.message}`);
      logger.error('Test vote failed', { component: 'DebugPage', data: err });
    }
  };
  
  // Fetch DB health logs
  const fetchDbLogs = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_recent_db_activity')
        .limit(20);
        
      if (error) throw error;
      
      setDbLogs(data || []);
    } catch (err: any) {
      logger.error('Failed to fetch DB logs', { component: 'DebugPage', data: err });
    }
  };
  
  // Check for any DB errors
  useEffect(() => {
    fetchDbLogs();
  }, []);

  // If not admin, don't render the page
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl mb-4">Voting App Debug Page</h1>
          
          <div className="mb-6 flex gap-2">
            <button 
              onClick={toggleDebugMode}
              className={`px-3 py-1 rounded text-sm ${
                debugMode ? 'bg-primary-400 text-dark-950' : 'bg-dark-800 text-primary-400'
              }`}
            >
              {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
            </button>
            
            <button 
              onClick={fetchDbLogs}
              className="px-3 py-1 rounded text-sm bg-dark-800 text-primary-400"
            >
              Refresh Logs
            </button>
          </div>
          
          {/* User Information */}
          <div className="card mb-6">
            <h2 className="text-xl mb-3">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-primary-400 mb-2">Auth Status</h3>
                <p className="text-sm">
                  <span className="text-gray-400">User ID: </span>
                  <span className="font-mono">{user?.id || 'Not logged in'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Email: </span>
                  <span className="font-mono">{user?.email || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Admin: </span>
                  <span className={`font-mono ${isAdmin ? 'text-success-400' : 'text-error-400'}`}>
                    {isAdmin ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              
              <div>
                <h3 className="text-primary-400 mb-2">Voting Status</h3>
                <p className="text-sm">
                  <span className="text-gray-400">Has Voted: </span>
                  <span className={`font-mono ${userVote ? 'text-success-400' : 'text-warning-400'}`}>
                    {userVote ? 'Yes' : 'No'}
                  </span>
                  {userVote && (
                    <button 
                      onClick={resetVote}
                      className="ml-2 text-xs bg-dark-800 px-2 py-1 rounded hover:bg-dark-700"
                    >
                      Reset Vote
                    </button>
                  )}
                </p>
                {userVote && (
                  <>
                    <p className="text-sm">
                      <span className="text-gray-400">Voted For: </span>
                      <span className="font-mono">
                        {candidates.find(c => c.id === userVote.candidate_id)?.name || userVote.candidate_id}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-400">Vote Time: </span>
                      <span className="font-mono">
                        {new Date(userVote.created_at).toLocaleString()}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Add Candidate */}
          <div className="card mb-6">
            <h2 className="text-xl mb-3">Add Candidate (Debug)</h2>
            <form onSubmit={addCandidate}>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input 
                  type="text"
                  className="input"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Genre</label>
                <input 
                  type="text"
                  className="input"
                  value={candidateGenre}
                  onChange={(e) => setCandidateGenre(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                className="btn btn-primary"
              >
                Add Candidate
              </button>
              {addStatus && (
                <p className={`mt-2 text-sm ${
                  addStatus.startsWith('Error') ? 'text-error-400' : 'text-success-400'
                }`}>
                  {addStatus}
                </p>
              )}
            </form>
          </div>
          
          {/* Test Vote */}
          {candidates.length > 0 && !userVote && (
            <div className="card mb-6">
              <h2 className="text-xl mb-3">Test Voting</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {candidates.map(candidate => (
                  <button
                    key={candidate.id}
                    onClick={() => testVote(candidate.id)}
                    className="bg-dark-800 hover:bg-dark-700 py-2 px-3 rounded text-left"
                  >
                    <span className="block text-primary-400">{candidate.name}</span>
                    <span className="block text-xs text-gray-400">{candidate.genre}</span>
                  </button>
                ))}
              </div>
              {voteStatus && (
                <p className={`mt-3 text-sm ${
                  voteStatus.includes('failed') || voteStatus.includes('Error') 
                    ? 'text-error-400' : 'text-success-400'
                }`}>
                  {voteStatus}
                </p>
              )}
            </div>
          )}
          
          {/* Navigation Links */}
          <div className="card mb-6">
            <h2 className="text-xl mb-3">Page Navigation</h2>
            <div className="flex flex-wrap gap-2">
              <a 
                href="/"
                className="bg-dark-800 hover:bg-dark-700 py-2 px-4 rounded"
              >
                Home
              </a>
              <a 
                href="/vote"
                className="bg-dark-800 hover:bg-dark-700 py-2 px-4 rounded"
              >
                Vote Page
              </a>
              <a 
                href="/admin"
                className="bg-dark-800 hover:bg-dark-700 py-2 px-4 rounded"
              >
                Admin Page
              </a>
              <a 
                href="/profile"
                className="bg-dark-800 hover:bg-dark-700 py-2 px-4 rounded"
              >
                Profile
              </a>
            </div>
          </div>
          
          {/* Recent DB Logs */}
          {dbLogs.length > 0 && (
            <div className="card mb-6 overflow-hidden">
              <h2 className="text-xl mb-3">Recent Database Activity</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-dark-900">
                    <tr>
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Action</th>
                      <th className="p-2 text-left">Table</th>
                      <th className="p-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbLogs.map((log, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-dark-800' : 'bg-dark-850'}>
                        <td className="p-2 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-2">{log.action}</td>
                        <td className="p-2">{log.table_name}</td>
                        <td className="p-2 font-mono truncate max-w-[300px]">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default DebugPage; 