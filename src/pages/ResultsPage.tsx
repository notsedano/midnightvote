import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import VoteChart from '../components/VoteChart';
import DJRankings from '../components/DJRankings';
import LoadingScreen from '../components/LoadingScreen';
import { RefreshCw, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

const ResultsPage: React.FC = () => {
  const { candidates, votes, voteCounts, totalVotes, isLoading, fetchVotes } = useVoting();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVotes();
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshing(false), 500); // Visual feedback
  };
  
  if (isLoading) {
    return <LoadingScreen message="Loading vote results..." />;
  }

  return (
    <Layout>
      <Banner 
        title="VOTING RESULTS"
        subtitle="REAL-TIME STATISTICS"
      />
      
      <div className="container mx-auto px-4">
        <div className="border border-[#9ACD32] bg-black p-3 mb-6">
          <div className="border-b border-[#9ACD32]/50 pb-2 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal size={16} className="text-[#9ACD32]" />
              <span className="text-[#9ACD32] font-mono text-sm">SYSTEM STATUS</span>
            </div>
            <motion.button 
              onClick={handleRefresh}
              className="border border-[#9ACD32] flex items-center space-x-1 px-3 py-1 bg-black text-[#9ACD32] text-xs font-mono"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>REFRESH</span>
            </motion.button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[#9ACD32]/30 p-2">
              <div className="text-xs text-[#9ACD32]/70 mb-1">TOTAL VOTES</div>
              <div className="text-xl text-[#9ACD32] font-mono">{totalVotes}</div>
            </div>
            <div className="border border-[#9ACD32]/30 p-2">
              <div className="text-xs text-[#9ACD32]/70 mb-1">LAST UPDATE</div>
              <div className="text-sm text-[#9ACD32] font-mono">
                {lastRefreshed.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Vote Distribution Chart */}
        <VoteChart candidates={candidates} voteCounts={voteCounts} />
        
        {/* DJ Rankings */}
        <DJRankings candidates={candidates} voteCounts={voteCounts} />
      </div>
      
      <Navigation />
    </Layout>
  );
};

export default ResultsPage;