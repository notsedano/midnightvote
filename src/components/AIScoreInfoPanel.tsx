import React, { useState } from 'react';
import { Shield, Info, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { getSpamDetectionCriteria } from '../lib/aiScoreUtils';

/**
 * AI Score Info Panel Component
 * 
 * This component displays information about the AI Score calculations and
 * includes a table of spam email detection criteria.
 */
const AIScoreInfoPanel: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const spamCriteria = getSpamDetectionCriteria();
  
  return (
    <div className="border border-[#9ACD32] bg-black p-3 mb-6 rounded-md">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <Shield size={16} className="text-[#9ACD32]" />
          <span className="text-[#9ACD32] font-mono text-sm">AI SCORE CRITERIA</span>
        </div>
        <div className="flex items-center text-[#9ACD32]/70 hover:text-[#9ACD32]">
          <Info size={14} className="mr-1" />
          <span className="text-xs mr-1">{expanded ? 'HIDE' : 'SHOW'} DETAILS</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 border-t border-[#9ACD32]/30 pt-3">
          <div className="mb-3 text-sm text-[#9ACD32]/90">
            <p className="mb-2">
              The AI Score measures vote quality based on email analytics and pattern recognition.
              Higher scores indicate more consistent voting patterns with stronger quality metrics.
            </p>
            <p className="text-xs text-white/70 mb-2 bg-black/50 p-2 border border-[#9ACD32]/20 rounded-sm">
              <span className="text-white font-bold">How to interpret AI Score:</span><br/>
              <span className="text-green-400">90%+ (EXCELLENT)</span>: Highest quality votes with exceptional pattern consistency<br/>
              <span className="text-blue-400">85-89% (GREAT)</span>: Very strong vote quality with high confidence metrics<br/>
              <span className="text-teal-400">80-84% (GOOD)</span>: Good vote quality with solid consistency patterns<br/>
              <span className="text-yellow-400">75-79% (FAIR)</span>: Fair vote quality with acceptable consistency patterns
            </p>
          </div>
          
          <div className="mb-4">
            <div className="text-xs text-white mb-2 font-bold">SCORE CALCULATION WEIGHTS</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {spamCriteria
                .filter(c => c.weight >= 10) // Only show criteria with significant weight
                .sort((a, b) => b.weight - a.weight) // Sort by weight descending
                .map((criteria, idx) => (
                  <div key={idx} className="border border-[#9ACD32]/20 p-2 rounded-sm bg-black/50">
                    <div className="text-xs text-[#9ACD32]/70 mb-1">{criteria.name.toUpperCase()}</div>
                    <div className="text-sm text-white font-bold">{criteria.weight.toFixed(0)}% weight</div>
                  </div>
                ))
              }
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="text-xs text-white mb-2 font-bold flex items-center">
              <Shield size={14} className="text-blue-400 mr-1" />
              <span>VOTE QUALITY ASSESSMENT CRITERIA</span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-[#9ACD32]/10 text-[#9ACD32]">
                <tr>
                  <th scope="col" className="px-4 py-2 font-mono">Quality Metric</th>
                  <th scope="col" className="px-4 py-2 font-mono">Description</th>
                  <th scope="col" className="px-4 py-2 font-mono text-right">Weight</th>
                </tr>
              </thead>
              <tbody>
                {spamCriteria.map((criteria, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-black' : 'bg-black/40'}>
                    <td className="px-4 py-2 font-mono text-[#9ACD32]/90">{criteria.name}</td>
                    <td className="px-4 py-2 text-white/80">{criteria.description}</td>
                    <td className="px-4 py-2 text-white/80 text-right font-mono">{criteria.weight.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-xs text-[#9ACD32]/70 border-t border-[#9ACD32]/30 pt-3">
            This analysis provides insight into voting patterns and helps ensure fair competition results. All DJs receive scores in the good to excellent range (75%-97%).
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScoreInfoPanel; 