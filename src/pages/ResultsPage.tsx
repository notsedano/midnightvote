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
import { supabase } from '../lib/supabase';

const ResultsPage: React.FC = () => {
  const { candidates, votes, voteCounts, totalVotes, isLoading, fetchVotes } = useVoting();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [bannerImage, setBannerImage] = useState<string>('');
  
  // Fetch banner image on load
  useEffect(() => {
    const fetchBannerImage = async () => {
      try {
        // First check localStorage
        const localBanner = localStorage.getItem('login_banner1');
        
        if (localBanner) {
          // Use localStorage value if available
          setBannerImage(localBanner);
        } else {
          // Fall back to database if localStorage is empty
          try {
            const { data, error } = await supabase
              .from('site_settings')
              .select('value')
              .eq('key', 'login_banner1')
              .single();
              
            if (error) throw error;
            
            if (data?.value) {
              setBannerImage(data.value);
              // Also save to localStorage for future use
              localStorage.setItem('login_banner1', data.value);
            }
          } catch (dbError) {
            console.error('Error fetching banner image from database:', dbError);
          }
        }
      } catch (error) {
        console.error('Error fetching banner image:', error);
      }
    };
    
    fetchBannerImage();
  }, []);
  
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
      
      <div className="container mx-auto px-4 pb-32">
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
      
      {/* Fixed Footer Banner */}
      {bannerImage ? (
        <div className="fixed bottom-0 left-0 w-full bg-black z-50">
          <div className="w-full border-t border-[#9ACD32]/30 overflow-hidden relative flex items-center justify-center bg-black">
            <img 
              src={bannerImage} 
              alt="Banner" 
              className="w-full h-24 object-cover opacity-90"
            />
          </div>
          <div className="w-full bg-black border-t border-[#9ACD32]/50 text-center py-2">
            <a href="https://midnightrebels.com" target="_blank" rel="noopener noreferrer" className="text-[#9ACD32] font-mono text-xs font-bold hover:text-white transition-colors">
              MIDNIGHT REBELS © 2023 ALL RIGHTS RESERVED
            </a>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

export default ResultsPage;