import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { Database, Hash, Clock, User, Terminal } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Transaction = {
  id: string;
  user_id: string;
  candidate_id: number;
  timestamp: string;
  candidateName: string;
};

const BlockExplorerPage: React.FC = () => {
  const { votes, candidates, isLoading } = useVoting();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [bannerImage, setBannerImage] = useState<string>('');
  const location = useLocation();
  
  // Parse URL parameters to find transaction ID
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const txId = searchParams.get('tx');
    
    if (txId && transactions.length > 0) {
      const tx = transactions.find(t => t.id === txId);
      if (tx) {
        setSelectedTx(tx);
        // Scroll to transaction details
        setTimeout(() => {
          const detailsElement = document.getElementById('transaction-details');
          if (detailsElement) {
            detailsElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    }
  }, [location.search, transactions]);
  
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
  
  // Process votes into transactions
  useEffect(() => {
    if (votes.length && candidates.length) {
      const txs = votes.map(vote => {
        const candidate = candidates.find(c => c.id === vote.candidate_id);
        return {
          id: vote.transaction_id,
          user_id: vote.user_id,
          candidate_id: vote.candidate_id,
          timestamp: vote.created_at,
          candidateName: candidate?.name || 'Unknown DJ'
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setTransactions(txs);
      
      // Check if we need to select a transaction based on URL
      const searchParams = new URLSearchParams(location.search);
      const txId = searchParams.get('tx');
      
      if (txId) {
        const tx = txs.find(t => t.id === txId);
        if (tx) {
          setSelectedTx(tx);
        }
      }
    }
  }, [votes, candidates, location.search]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black pb-36 font-mono">
      <Banner 
        title="VOTE TRANSACTION EXPLORER"
        subtitle="BLOCKCHAIN ANALYSIS INTERFACE"
      />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Stats */}
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg text-[#9ACD32]">Vote Statistics</h2>
              <Terminal size={16} className="text-[#9ACD32]" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Total Blocks</p>
                <p className="text-xl text-[#9ACD32]">{transactions.length}</p>
              </div>
              
              <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Verified Voters</p>
                <p className="text-xl text-[#9ACD32]">
                  {new Set(transactions.map(t => t.user_id)).size}
                </p>
              </div>
            </div>
          </div>
          
          {/* Selected Transaction */}
          <div id="transaction-details" className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg text-[#9ACD32]">Transaction Details</h2>
              <Database size={16} className="text-[#9ACD32]" />
            </div>
            
            {selectedTx ? (
              <div className="space-y-3 mt-4">
                <div className="flex items-start space-x-2">
                  <Hash size={16} className="text-[#9ACD32] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Transaction ID</p>
                    <p className="text-white break-all">{selectedTx.id}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <User size={16} className="text-[#9ACD32] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Voter ID</p>
                    <p className="text-white break-all">{selectedTx.user_id}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Clock size={16} className="text-[#9ACD32] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Timestamp</p>
                    <p className="text-white">
                      {new Date(selectedTx.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Vote Cast For</p>
                  <p className="text-lg text-[#9ACD32]">{selectedTx.candidateName}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Database size={32} className="text-[#9ACD32]/50 mb-2" />
                <p className="text-gray-400">
                  SELECT A TRANSACTION BLOCK TO VIEW DETAILS
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Transaction Blocks */}
        <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-[#9ACD32]">Recent Vote Transactions</h2>
            <Hash size={16} className="text-[#9ACD32]" />
          </div>
          
          {transactions.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mt-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-2 border hover:border-[#9ACD32] cursor-pointer transition-colors duration-200 text-center ${
                    selectedTx?.id === tx.id 
                      ? 'border-[#9ACD32] bg-[#9ACD32]/10' 
                      : 'border-gray-800 bg-black hover:bg-[#9ACD32]/5'
                  }`}
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="text-[#9ACD32] text-xs mb-1">
                    {tx.id.substring(0, 4)}...{tx.id.substring(tx.id.length - 4)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              NO VOTE TRANSACTIONS RECORDED YET
            </div>
          )}
        </div>
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
    </div>
  );
};

export default BlockExplorerPage;