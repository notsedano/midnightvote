import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import VoteChart from '../components/VoteChart';
import LoadingScreen from '../components/LoadingScreen';
import { RefreshCw } from 'lucide-react';

const ResultsPage: React.FC = () => {
  const { candidates, votes, voteCounts, totalVotes, isLoading, fetchVotes } = useVoting();
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Create sorted leaderboard of candidates
  useEffect(() => {
    if (candidates.length && Object.keys(voteCounts).length) {
      const sorted = [...candidates].sort((a, b) => {
        const votesA = voteCounts[a.id] || 0;
        const votesB = voteCounts[b.id] || 0;
        return votesB - votesA;
      });
      
      setLeaderboard(sorted);
    }
  }, [candidates, voteCounts]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVotes();
    setTimeout(() => setRefreshing(false), 500); // Visual feedback
  };
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <Banner 
        imageUrl="https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg?auto=compress&cs=tinysrgb&w=800"
        title="Live Voting Results"
      />
      
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-400">Total Votes</p>
            <p className="text-xl font-mono text-primary-400">{totalVotes}</p>
          </div>
          
          <button 
            onClick={handleRefresh}
            className="flex items-center space-x-1 bg-dark-800 hover:bg-dark-700 py-2 px-3 rounded-md text-sm"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={`text-primary-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Vote Distribution Chart */}
        <div className="card mb-6">
          <h2 className="text-lg font-mono text-primary-400 mb-4">Vote Distribution</h2>
          <VoteChart candidates={candidates} voteCounts={voteCounts} />
        </div>
        
        {/* DJ Rankings */}
        <div className="card">
          <h2 className="text-lg font-mono text-primary-400 mb-4">DJ Rankings</h2>
          
          {leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((candidate, index) => {
                const voteCount = voteCounts[candidate.id] || 0;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                
                return (
                  <div 
                    key={candidate.id}
                    className="flex items-center space-x-3 p-3 bg-dark-900 rounded-md"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-primary-400 text-dark-950 rounded-full font-mono">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-primary-400">{candidate.name}</span>
                        <span className="text-gray-400">{voteCount} votes</span>
                      </div>
                      
                      <div className="voting-progress">
                        <div 
                          className="voting-progress-bar" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400">No votes recorded yet.</p>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default ResultsPage;