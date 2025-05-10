import React from 'react';
import { motion } from 'framer-motion';
import { Award, Terminal } from 'lucide-react';

interface Candidate {
  id: number;
  name: string;
  genre?: string;
  image_url?: string | null;
}

interface DJRankingsProps {
  candidates: Candidate[];
  voteCounts: Record<number, number>;
}

const DJRankings: React.FC<DJRankingsProps> = ({ candidates, voteCounts }) => {
  // Sort candidates by vote count (descending)
  const sortedCandidates = [...candidates].sort((a, b) => 
    (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
  );
  
  // Calculate total votes
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="border border-[#9ACD32] bg-black p-3 mb-6">
      <div className="border-b border-[#9ACD32]/50 pb-2 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-[#9ACD32]" />
          <span className="text-[#9ACD32] font-mono text-sm">DJ RANKINGS</span>
        </div>
        <div className="text-xs text-[#9ACD32]/70">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            LIVE DATA
          </motion.span>
        </div>
      </div>
      
      <div className="space-y-2">
        {sortedCandidates.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[#9ACD32]/70 text-sm">No candidates available</p>
          </div>
        ) : (
          sortedCandidates.map((candidate, index) => (
            <motion.div 
              key={candidate.id}
              className="border border-[#9ACD32]/30 p-3 bg-black"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#9ACD32] text-black font-mono font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <p className="text-[#9ACD32] font-mono">{candidate.name}</p>
                  {candidate.genre && (
                    <p className="text-[#9ACD32]/70 text-xs">{candidate.genre}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-[#9ACD32] font-mono">{voteCounts[candidate.id] || 0} votes</p>
                  <div className="mt-1 w-full bg-black border border-[#9ACD32]/30 h-1.5">
                    <motion.div 
                      className="h-full bg-[#9ACD32]"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${totalVotes > 0 
                          ? ((voteCounts[candidate.id] || 0) / totalVotes) * 100 
                          : 0}%` 
                      }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {sortedCandidates.length > 0 && (
        <div className="border-t border-[#9ACD32]/30 mt-3 pt-2 text-xs text-[#9ACD32]/70 flex items-center">
          <Award size={14} className="mr-1" />
          <span>LEADER: {sortedCandidates[0]?.name || 'N/A'}</span>
        </div>
      )}
    </div>
  );
};

export default DJRankings; 