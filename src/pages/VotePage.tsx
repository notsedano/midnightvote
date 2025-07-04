import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import VoteCard from '../components/VoteCard';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import VoteNotification from '../components/VoteNotification';
import { motion } from 'framer-motion';
import { Music, Info, Headphones, Terminal, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

/**
 * Vote Page Component
 * 
 * This page displays the DJ candidates and allows users to vote.
 * Note: The YouTube thumbnails can be clicked to watch videos, 
 * while the DJ cards can be pressed and held to cast votes.
 * These interactions are isolated to prevent conflicts.
 */
const VotePage: React.FC = () => {
  const { candidates, voteCounts, totalVotes, userVote, isLoading, castVote, error: votingError, lastVoteCancelled } = useVoting();
  const { user } = useAuth();
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [voteCancelled, setVoteCancelled] = useState(false);
  const [bannerImage, setBannerImage] = useState<string>('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const navigate = useNavigate();
  
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
  
  // Reset vote submitted state when userVote changes
  useEffect(() => {
    console.log("VOTE STATE CHANGE DETECTED", {
      hasUserVote: !!userVote,
      lastVoteCancelled,
      voteCancelled
    });
    
    if (userVote) {
      console.log("USER HAS ACTIVE VOTE", userVote);
      setVoteSubmitted(true);
      showNotification("Your vote has been recorded successfully!", "success");
      setVoteCancelled(false);
    }
  }, [userVote]);
  
  // Display voting errors
  useEffect(() => {
    if (votingError) {
      setError(votingError);
      showNotification(votingError, "error");
    }
  }, [votingError]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      message,
      type,
      isVisible: true
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  const handleVote = async (candidateId: number) => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user has already voted
    if (userVote) {
      setError("You have already voted.");
      showNotification("You have already voted.", "error");
      return;
    }
    
    setError(null);
    showNotification("Submitting your vote...", "info");
    
    try {
      console.log("Attempting to cast vote for candidate:", candidateId);
      const result = await castVote(candidateId);
      
      if (result.success) {
        setVoteSubmitted(true);
        showNotification("Your vote has been recorded successfully!", "success");
        console.log("Vote successful!");
      } else {
        throw new Error(result.error || "Failed to cast vote");
      }
    } catch (err: any) {
      console.error("Error casting vote:", err);
      setError(err.message || "Failed to cast your vote. Please try again.");
      showNotification(err.message || "Failed to cast your vote. Please try again.", "error");
    }
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  if (isLoading) {
    return <LoadingScreen message="Loading voting interface..." />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
        subtitle="DJ COMPETITION - HOLD TO VOTE, VOTES ARE PERMANENT"
      />
      
      <div className="container mx-auto px-4 py-4 relative mb-20">
        {/* Instructions Panel */}
        <div className="border border-[#9ACD32] bg-black p-3 mb-6 rounded-md">
          <div className="border-b border-[#9ACD32]/50 pb-2 mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal size={16} className="text-[#9ACD32]" />
              <span className="text-[#9ACD32] font-mono text-sm">VOTING INSTRUCTIONS</span>
            </div>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-[#9ACD32]/70 hover:text-[#9ACD32] flex items-center text-xs"
            >
              <Info size={14} className="mr-1" />
              {showInfo ? 'HIDE' : 'SHOW'} DETAILS
            </button>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center text-[#9ACD32] font-mono">
              {userVote 
                ? <span className="flex items-center"><Headphones size={16} className="mr-2" /> You've voted for {userVote ? candidates.find(c => c.id === userVote.candidate_id)?.name : 'a DJ'}</span>
                : <span className="flex items-center"><Music size={16} className="mr-2" /> Hold a DJ card for 3.5s to vote</span>
              }
            </div>
          </div>
          
          {showInfo && (
            <motion.div 
              className="border border-[#9ACD32]/30 p-3 mb-3 text-xs text-[#9ACD32]/90 font-mono rounded-md"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="mb-2">1. <strong>PRESS AND HOLD</strong> on a DJ card for 1.5 seconds to cast your vote.</p>
              <p className="mb-2">2. You can vote for <strong>ONLY ONE DJ</strong> in the competition.</p>
              <p>3. <strong>TAP</strong> on a YouTube thumbnail to watch the DJ's performance video.</p>
            </motion.div>
          )}
          
          {userVote && (
            <div className="border-t border-[#9ACD32]/30 pt-3 mt-2">
              <div className="flex flex-col items-center px-4 py-3 bg-black/80 border border-[#9ACD32]/30 text-[#9ACD32] font-mono text-sm rounded-md w-full">
                <span className="mb-2">YOUR VOTE HAS BEEN RECORDED ONCHAIN</span>
                <Link 
                  to={`/explorer?tx=${userVote.transaction_id}`} 
                  className="w-full max-w-md hover:text-white"
                >
                  <div className="px-4 py-2 border border-[#9ACD32]/40 bg-[#9ACD32]/5 rounded-md hover:bg-[#9ACD32]/10 transition-colors flex items-center justify-between group">
                    <div>
                      <span className="text-sm font-bold flex items-center">
                        <Terminal size={14} className="mr-1.5" />
                        VIEW TRANSACTION DETAILS
                      </span>
                      <div className="flex flex-col text-xs text-[#9ACD32]/70 mt-1.5 space-y-1">
                        <span className="truncate">#txn-{userVote.transaction_id.substring(0, 6)}...{userVote.transaction_id.substring(userVote.transaction_id.length - 4)}</span>
                        <span className="truncate">#voter-{userVote.user_id && userVote.user_id.substring(0, 4)}...</span>
                        <span className="truncate">#time-{new Date(userVote.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border border-[#9ACD32]/50 flex items-center justify-center group-hover:bg-[#9ACD32]/20 transition-colors">
                      <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* DJ Cards Grid */}
        {candidates.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {candidates.map((candidate) => (
              <motion.div key={candidate.id} variants={cardVariants}>
                <VoteCard
                  id={candidate.id}
                  name={candidate.name}
                  genre={candidate.genre}
                  image={candidate.image_url}
                  youtube_url={candidate.youtube_url}
                  instagram_username={candidate.instagram_username}
                  voteCount={voteCounts[candidate.id] || 0}
                  totalVotes={totalVotes}
                  hasVoted={!!userVote}
                  userVoted={userVote?.candidate_id === candidate.id}
                  onVote={handleVote}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="border border-[#9ACD32] bg-black p-6 text-center rounded-md">
            <Music size={48} className="mx-auto text-[#9ACD32]/50 mb-4" />
            <p className="text-[#9ACD32] mb-2 font-mono">No candidates available yet</p>
            <p className="text-sm text-[#9ACD32]/70 font-mono">Check back soon</p>
          </div>
        )}
      </div>
      
      {/* Notification */}
      <VoteNotification 
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      
      <Navigation />
    </Layout>
  );
};

export default VotePage;