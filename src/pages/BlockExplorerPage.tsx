import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { Database, Hash, Clock, User, Terminal, Globe } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';

type Transaction = {
  id: string;
  user_id: string;
  candidate_id: number;
  timestamp: string;
  candidateName: string;
  ip_address?: string;
};

const BlockExplorerPage: React.FC = () => {
  const { votes, candidates, isLoading } = useVoting();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchParams] = useSearchParams();
  const txId = searchParams.get('tx');
  
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
          candidateName: candidate?.name || 'Unknown DJ',
          ip_address: vote.ip_address || 'IP not recorded' // Use actual IP from vote record if available
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setTransactions(txs);
      
      // If a transaction ID is provided in the URL, select that transaction
      if (txId) {
        const transaction = txs.find(tx => tx.id === txId);
        if (transaction) {
          setSelectedTx(transaction);
        }
      }
    }
  }, [votes, candidates, txId]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black pb-20 font-mono">
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
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg text-[#9ACD32]">Transaction Details</h2>
              <Database size={16} className="text-[#9ACD32]" />
            </div>
            
            {selectedTx ? (
              <div className="space-y-3 mt-4">
                <div className="flex items-start space-x-2">
                  <Hash size={16} className="text-[#9ACD32] mt-1 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                    <div className="p-2 bg-[#9ACD32]/5 border border-[#9ACD32]/20 rounded-md">
                      <p className="text-[#9ACD32] font-mono break-all text-sm">
                        #txn-{selectedTx.id}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <User size={16} className="text-[#9ACD32] mt-1 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-xs text-gray-400 mb-1">Voter ID</p>
                    <div className="p-2 bg-[#9ACD32]/5 border border-[#9ACD32]/20 rounded-md">
                      <p className="text-[#9ACD32] font-mono break-all text-sm">
                        #voter-{selectedTx.user_id}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Globe size={16} className="text-[#9ACD32] mt-1 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-xs text-gray-400 mb-1">IP Address</p>
                    <div className="p-2 bg-[#9ACD32]/5 border border-[#9ACD32]/20 rounded-md">
                      <p className="text-[#9ACD32] font-mono break-all text-sm">
                        {selectedTx.ip_address || 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Clock size={16} className="text-[#9ACD32] mt-1 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-xs text-gray-400 mb-1">Timestamp</p>
                    <div className="p-2 bg-[#9ACD32]/5 border border-[#9ACD32]/20 rounded-md">
                      <p className="text-[#9ACD32] font-mono text-sm">
                        #time-{new Date(selectedTx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-black border border-[#9ACD32]/30 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Vote Cast For</p>
                  <p className="text-lg text-[#9ACD32] font-bold">{selectedTx.candidateName}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-3 border hover:border-[#9ACD32] cursor-pointer transition-colors duration-200 ${
                    selectedTx?.id === tx.id 
                      ? 'border-[#9ACD32] bg-[#9ACD32]/10' 
                      : 'border-gray-800 bg-black hover:bg-[#9ACD32]/5'
                  }`}
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[#9ACD32] font-mono text-xs font-bold">
                      #{tx.id.substring(0, 4)}...{tx.id.substring(tx.id.length - 4)}
                    </div>
                    <div className="px-1.5 py-0.5 bg-[#9ACD32]/10 border border-[#9ACD32]/20 rounded-sm text-[10px] text-[#9ACD32]">
                      BLOCK
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">DJ: </span>
                    <span className="text-[#9ACD32] truncate ml-1">{tx.candidateName}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">Time: </span>
                    <span className="text-[#9ACD32]/80 truncate ml-1">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </span>
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
    </div>
  );
};

export default BlockExplorerPage;