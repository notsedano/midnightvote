import React, { useState, useEffect, useRef } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import VoteChart from '../components/VoteChart';
import DJRankings from '../components/DJRankings';
import LoadingScreen from '../components/LoadingScreen';
import { 
  RefreshCw, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Database, 
  Lock, 
  Shield, 
  Hash, 
  User, 
  Globe, 
  Clock, 
  Search, 
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Helper function to get YouTube thumbnail URL from YouTube video URL
const getYouTubeThumbnail = (url: string | null) => {
  if (!url) return null;
  
  // Extract video ID from different YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    const videoId = match[2];
    // Return high-quality thumbnail
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  return null;
};

// Helper function to get YouTube video ID from URL
const getYouTubeVideoId = (url: string | null) => {
  if (!url) return null;
  
  // Extract video ID from different YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

const ResultsPage: React.FC = () => {
  const { candidates, votes, voteCounts, totalVotes, isLoading, fetchVotes } = useVoting();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [bannerImage, setBannerImage] = useState<string>('');
  const [votingEnded, setVotingEnded] = useState<boolean>(false);
  const [votingEndedAt, setVotingEndedAt] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<number | null>(null);
  const [expandedTransactions, setExpandedTransactions] = useState<Record<number, boolean>>({});
  const [showAllDJs, setShowAllDJs] = useState<boolean>(false);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Check if voting has ended on mount
  useEffect(() => {
    const checkVotingEnded = async () => {
      const value = localStorage.getItem('voting_ended');
      if (value === 'true') {
        setVotingEnded(true);
        // Try to get timestamp
        const ts = localStorage.getItem('voting_ended_at');
        if (ts) setVotingEndedAt(ts);
      } else {
        // Try to fetch from DB if not in localStorage
        const { data, error } = await supabase
          .from('site_settings')
          .select('value, updated_at')
          .eq('key', 'voting_ended')
          .single();
        if (data?.value === 'true') {
          setVotingEnded(true);
          localStorage.setItem('voting_ended', 'true');
          if (data.updated_at) {
            setVotingEndedAt(data.updated_at);
            localStorage.setItem('voting_ended_at', data.updated_at);
          }
        }
      }
    };
    checkVotingEnded();
  }, []);
  
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
  
  const toggleResultsExpand = (candidateId: number) => {
    setExpandedResults(expandedResults === candidateId ? null : candidateId);
    // Auto scroll to results section if needed
    if (expandedResults !== candidateId && resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const toggleTransactionExpand = (candidateId: number) => {
    setExpandedTransactions({
      ...expandedTransactions,
      [candidateId]: !expandedTransactions[candidateId]
    });
  };
  
  // Sort candidates by vote count (descending)
  const sortedCandidates = [...candidates].sort((a, b) => 
    (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
  );
  
  // Get top 5 candidates
  const topCandidates = sortedCandidates.slice(0, 5);
  
  // Get candidate-specific votes
  const getCandidateVotes = (candidateId: number) => {
    return votes
      .filter(vote => vote.candidate_id === candidateId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };
  
  if (isLoading) {
    return <LoadingScreen message="Loading vote results..." />;
  }

  return (
    <Layout>
      {/* Add the banner image at the top */}
      {bannerImage ? (
        <div className="w-full bg-black relative">
          <div className="w-full border-b border-[#9ACD32]/30 overflow-hidden relative flex items-center justify-center bg-black">
            <img 
              src={bannerImage} 
              alt="Banner" 
              className="w-full h-40 object-cover"
            />
          </div>
        </div>
      ) : null}
      
      <Banner 
        title="MIDNIGHTREBELS &FRIENDS"
        subtitle={votingEnded ? "COMPETITION RESULTS - OFFICIAL DATA" : "LIVE VOTE COUNTS - PRELIMINARY DATA"}
      />
      
      <div className="container mx-auto px-4 pb-20">
        {/* System Status Panel */}
        <div className="border border-[#9ACD32] bg-black p-3 mb-6 rounded-md">
          <div className="border-b border-[#9ACD32]/50 pb-2 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal size={16} className="text-[#9ACD32]" />
              <span className="text-[#9ACD32] font-mono text-sm">BLOCKCHAIN VOTE VERIFICATION</span>
            </div>
            <motion.button 
              onClick={handleRefresh}
              className="border border-[#9ACD32] flex items-center space-x-1 px-3 py-1 bg-black text-[#9ACD32] text-xs font-mono rounded-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>REFRESH</span>
            </motion.button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-[#9ACD32]/30 p-2 rounded-sm">
              <div className="text-xs text-[#9ACD32]/70 mb-1">TOTAL VOTES</div>
              <div className="text-xl text-[#9ACD32] font-mono">{totalVotes}</div>
            </div>
            <div className="border border-[#9ACD32]/30 p-2 rounded-sm">
              <div className="text-xs text-[#9ACD32]/70 mb-1">UNIQUE VOTERS</div>
              <div className="text-xl text-[#9ACD32] font-mono">
                {new Set(votes.map(v => v.user_id)).size}
              </div>
            </div>
            <div className="border border-[#9ACD32]/30 p-2 rounded-sm">
              <div className="text-xs text-[#9ACD32]/70 mb-1">VOTING STATUS</div>
              <div className="text-sm text-[#9ACD32] font-mono flex items-center">
                {votingEnded ? (
                  <>
                    <Lock size={14} className="mr-1 text-[#9ACD32]" />
                    <span>CLOSED</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#9ACD32] mr-2 animate-pulse" />
                    <span>LIVE</span>
                  </>
                )}
              </div>
            </div>
            <div className="border border-[#9ACD32]/30 p-2 rounded-sm">
              <div className="text-xs text-[#9ACD32]/70 mb-1">LAST UPDATE</div>
              <div className="text-sm text-[#9ACD32] font-mono">
                {lastRefreshed.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {votingEnded && votingEndedAt && (
            <div className="mt-3 text-center text-sm text-[#9ACD32]/70 font-mono">
              <Clock size={14} className="inline-block mr-1" />
              Voting ended: {new Date(votingEndedAt).toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Top 5 Results */}
        <div className="border border-[#9ACD32] bg-black p-3 mb-6 rounded-md">
          <div className="border-b border-[#9ACD32]/50 pb-2 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award size={16} className="text-[#9ACD32]" />
              <span className="text-[#9ACD32] font-mono text-sm">TOP PERFORMERS</span>
            </div>
            {sortedCandidates.length > 5 && (
              <button 
                onClick={() => setShowAllDJs(!showAllDJs)}
                className="text-[#9ACD32]/70 hover:text-[#9ACD32] text-xs flex items-center"
              >
                {showAllDJs ? (
                  <>
                    <span>SHOW TOP 5</span>
                    <ChevronUp size={14} className="ml-1" />
                  </>
                ) : (
                  <>
                    <span>SHOW ALL ({sortedCandidates.length})</span>
                    <ChevronDown size={14} className="ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {(showAllDJs ? sortedCandidates : topCandidates).map((candidate, index) => (
              <motion.div 
                key={candidate.id}
                className={`border cursor-pointer transition-colors ${
                  expandedResults === candidate.id
                    ? 'border-[#9ACD32] bg-[#9ACD32]/10'
                    : 'border-[#9ACD32]/30 hover:border-[#9ACD32]/60'
                } rounded-md overflow-hidden`}
                onClick={() => toggleResultsExpand(candidate.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center p-3">
                  {/* Rank */}
                  <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-300' : 
                    index === 2 ? 'bg-amber-700' : 
                    'bg-[#9ACD32]/30'
                  } text-black font-mono font-bold rounded-sm`}>
                    {index + 1}
                  </div>
                  
                  {/* DJ Info */}
                  <div className="flex-1 ml-3">
                    <p className="text-[#9ACD32] font-mono">{candidate.name}</p>
                    {candidate.genre && (
                      <p className="text-[#9ACD32]/70 text-xs">{candidate.genre}</p>
                    )}
                  </div>
                  
                  {/* Vote count */}
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-[#9ACD32] font-mono font-bold">{voteCounts[candidate.id] || 0}</p>
                        <p className="text-[#9ACD32]/70 text-xs">votes</p>
                      </div>
                      <div className={`w-6 h-6 flex items-center justify-center text-[#9ACD32] transition-transform ${
                        expandedResults === candidate.id ? 'rotate-180' : ''
                      }`}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedResults === candidate.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t border-[#9ACD32]/30"
                      ref={resultsSectionRef}
                    >
                      <div className="p-3 space-y-3">
                        {/* Stats Section */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                          <div className="border border-[#9ACD32]/30 p-2 rounded-sm bg-black">
                            <div className="text-xs text-[#9ACD32]/70 mb-1">VOTES</div>
                            <div className="text-lg text-[#9ACD32] font-mono">{voteCounts[candidate.id] || 0}</div>
                          </div>
                          <div className="border border-[#9ACD32]/30 p-2 rounded-sm bg-black">
                            <div className="text-xs text-[#9ACD32]/70 mb-1">PERCENTAGE</div>
                            <div className="text-lg text-[#9ACD32] font-mono">
                              {totalVotes > 0 
                                ? Math.round(((voteCounts[candidate.id] || 0) / totalVotes) * 100) 
                                : 0}%
                            </div>
                          </div>
                          <div className="border border-[#9ACD32]/30 p-2 rounded-sm bg-black">
                            <div className="text-xs text-[#9ACD32]/70 mb-1">RANK</div>
                            <div className="text-lg text-[#9ACD32] font-mono">#{index + 1}</div>
                          </div>
                          <div className="border border-[#9ACD32]/30 p-2 rounded-sm bg-black">
                            <div className="text-xs text-[#9ACD32]/70 mb-1">VERIFIED</div>
                            <div className="text-lg text-[#9ACD32] font-mono flex justify-center items-center">
                              <Shield size={16} className="text-[#9ACD32] mr-1" />
                              <span>YES</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* DJ Profile */}
                        <div className="flex flex-col space-y-3 p-2 bg-black/50 border border-[#9ACD32]/30 rounded-sm">
                          <div className="flex items-center space-x-3">
                            {candidate.image_url && (
                              <div className="w-16 h-16 rounded-sm border border-[#9ACD32]/50 overflow-hidden">
                                <img src={candidate.image_url} alt={candidate.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <p className="text-[#9ACD32] font-mono text-lg">{candidate.name}</p>
                              {candidate.genre && (
                                <p className="text-[#9ACD32]/70 text-sm">{candidate.genre}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* YouTube Thumbnail */}
                          {candidate.youtube_url && (
                            <div className="w-full border border-[#9ACD32]/30 bg-black/70 rounded-sm overflow-hidden">
                              <a 
                                href={candidate.youtube_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block relative group"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center">
                                  {/* Thumbnail with smaller aspect ratio */}
                                  <div className="w-24 h-16 relative overflow-hidden flex-shrink-0">
                                    {getYouTubeThumbnail(candidate.youtube_url) ? (
                                      <img 
                                        src={getYouTubeThumbnail(candidate.youtube_url)!} 
                                        alt={`${candidate.name} performance`} 
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-black flex items-center justify-center">
                                        <Youtube size={20} className="text-[#9ACD32]/30" />
                                      </div>
                                    )}
                                    
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-black/50 border border-[#9ACD32] flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Youtube size={12} className="text-[#9ACD32]" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Text label */}
                                  <div className="p-2 flex items-center flex-1">
                                    <Youtube size={14} className="text-[#9ACD32] mr-2 flex-shrink-0" />
                                    <span className="text-xs text-[#9ACD32]/80 font-mono">Watch Performance</span>
                                  </div>
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {/* Recent Transactions */}
                        <div>
                          <div 
                            className="flex items-center justify-between cursor-pointer p-2 border border-[#9ACD32]/30 rounded-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTransactionExpand(candidate.id);
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <Database size={14} className="text-[#9ACD32]" />
                              <span className="text-[#9ACD32] font-mono text-sm">VOTE TRANSACTIONS</span>
                            </div>
                            <div className={`transform transition-transform ${expandedTransactions[candidate.id] ? 'rotate-180' : ''}`}>
                              <ChevronDown size={16} className="text-[#9ACD32]" />
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedTransactions[candidate.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-l border-r border-b border-[#9ACD32]/30 rounded-b-sm"
                              >
                                <div className="p-2 space-y-2 max-h-96 overflow-y-auto bg-black/50">
                                  {getCandidateVotes(candidate.id).length > 0 ? (
                                    getCandidateVotes(candidate.id).map((vote) => (
                                      <div key={vote.id} className="border border-[#9ACD32]/30 p-2 rounded-sm text-xs bg-black">
                                        <div className="flex justify-between border-b border-[#9ACD32]/20 pb-1 mb-1">
                                          <span className="text-[#9ACD32]/70">TRANSACTION</span>
                                          <span className="text-[#9ACD32]">#{vote.transaction_id.substring(0, 6)}...</span>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center">
                                            <Hash size={12} className="text-[#9ACD32]/70 mr-1" />
                                            <span className="text-[#9ACD32] font-mono truncate">
                                              {vote.id}
                                            </span>
                                          </div>
                                          <div className="flex items-center">
                                            <User size={12} className="text-[#9ACD32]/70 mr-1" />
                                            <span className="text-[#9ACD32] font-mono truncate">
                                              {vote.user_id.substring(0, 8)}...
                                            </span>
                                          </div>
                                          <div className="flex items-center">
                                            <Globe size={12} className="text-[#9ACD32]/70 mr-1" />
                                            {vote.ip_address && vote.ip_address !== 'IP not recorded' ? (
                                              <div className="flex items-center text-[#9ACD32] font-mono">
                                                {vote.ip_address.split('.').map((octet, idx) => (
                                                  <span key={idx}>
                                                    {idx === 0 ? octet : '***'}
                                                    {idx < 3 ? <span className="mx-0.5">.</span> : null}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-[#9ACD32]/50 font-mono">****.****.****</span>
                                            )}
                                          </div>
                                          <div className="flex items-center">
                                            <Clock size={12} className="text-[#9ACD32]/70 mr-1" />
                                            <span className="text-[#9ACD32] font-mono text-[10px]">
                                              {new Date(vote.created_at).toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-2 text-[#9ACD32]/50">
                                      No transactions found
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-2 text-right border-t border-[#9ACD32]/20">
                                  <button 
                                    className="text-xs text-[#9ACD32]/70 hover:text-[#9ACD32] flex items-center ml-auto"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/explorer?dj=${candidate.id}`);
                                    }}
                                  >
                                    <Search size={12} className="mr-1" />
                                    View All Transactions
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Vote Chart */}
        <VoteChart candidates={candidates} voteCounts={voteCounts} />
        
        {/* DJ Rankings (if still needed) */}
        <DJRankings candidates={candidates} voteCounts={voteCounts} />
        
        {/* Security Info */}
        <div className="border border-[#9ACD32]/30 bg-black p-3 mb-6 rounded-md">
          <div className="flex items-center space-x-2 mb-3">
            <Shield size={16} className="text-[#9ACD32]" />
            <span className="text-[#9ACD32] font-mono text-sm">BLOCKCHAIN SECURITY</span>
          </div>
          
          <p className="text-xs text-[#9ACD32]/70 font-mono mb-2">
            All votes are securely stored on-chain with cryptographic verification. Each transaction includes:
          </p>
          
          <ul className="text-xs text-[#9ACD32]/70 font-mono space-y-1 mb-3">
            <li className="flex items-center">
              <Hash size={12} className="mr-1 text-[#9ACD32]" />
              <span>Unique transaction hash and vote ID</span>
            </li>
            <li className="flex items-center">
              <User size={12} className="mr-1 text-[#9ACD32]" />
              <span>Anonymous but verifiable voter identity</span>
            </li>
            <li className="flex items-center">
              <Globe size={12} className="mr-1 text-[#9ACD32]" />
              <span>Partial IP address with privacy protection</span>
            </li>
            <li className="flex items-center">
              <Clock size={12} className="mr-1 text-[#9ACD32]" />
              <span>Immutable timestamp</span>
            </li>
          </ul>
          
          <div className="text-center">
            <button 
              onClick={() => navigate('/explorer')}
              className="text-xs text-[#9ACD32] hover:text-white transition-colors mt-2 border border-[#9ACD32]/50 px-3 py-1 rounded-sm"
            >
              Explore Vote Blockchain
            </button>
          </div>
        </div>
      </div>
      
      <Navigation />
    </Layout>
  );
};

export default ResultsPage;