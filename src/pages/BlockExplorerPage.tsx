import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { Database, Hash, Clock, User } from 'lucide-react';

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
    }
  }, [votes, candidates]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <Banner 
        imageUrl="https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=800"
        title="Vote Transaction Explorer"
      />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Stats */}
          <div className="card">
            <h2 className="text-lg font-mono text-primary-400 mb-4">Vote Statistics</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-dark-800 rounded-md">
                <p className="text-sm text-gray-400">Total Blocks</p>
                <p className="text-xl font-mono text-primary-400">{transactions.length}</p>
              </div>
              
              <div className="p-3 bg-dark-800 rounded-md">
                <p className="text-sm text-gray-400">Verified Voters</p>
                <p className="text-xl font-mono text-primary-400">
                  {new Set(transactions.map(t => t.user_id)).size}
                </p>
              </div>
            </div>
          </div>
          
          {/* Selected Transaction */}
          <div className="card">
            <h2 className="text-lg font-mono text-primary-400 mb-4">Transaction Details</h2>
            
            {selectedTx ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Hash size={16} className="text-primary-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Transaction ID</p>
                    <p className="font-mono text-white break-all">{selectedTx.id}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <User size={16} className="text-primary-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Voter ID</p>
                    <p className="font-mono text-white break-all">{selectedTx.user_id}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Clock size={16} className="text-primary-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Timestamp</p>
                    <p className="font-mono text-white">
                      {new Date(selectedTx.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-dark-800 rounded-md">
                  <p className="text-xs text-gray-400">Vote Cast For</p>
                  <p className="text-lg font-mono text-primary-400">{selectedTx.candidateName}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6">
                <Database size={32} className="text-gray-600 mb-2" />
                <p className="text-gray-400 text-center">
                  Select a transaction block to view details
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Transaction Blocks */}
        <div className="card">
          <h2 className="text-lg font-mono text-primary-400 mb-4">Recent Vote Transactions</h2>
          
          {transactions.length > 0 ? (
            <div className="block-grid">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`block-item ${selectedTx?.id === tx.id ? 'border-primary-400 bg-dark-700' : ''}`}
                  onClick={() => setSelectedTx(tx)}
                >
                  <div className="text-center">
                    <div className="text-primary-400 text-xs mb-1">
                      {tx.id.substring(0, 4)}...{tx.id.substring(tx.id.length - 4)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No vote transactions recorded yet.</p>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default BlockExplorerPage;