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
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';

/**
 * Vote Page Component
 * 
 * This page displays the DJ candidates and allows users to vote.
 * Note: The YouTube thumbnails can be clicked to watch videos, 
 * while the DJ cards can be pressed and held to cast votes.
 * These interactions are isolated to prevent conflicts.
 */
const VotePage: React.FC = () => {
  const { candidates, voteCounts, totalVotes, userVote, isLoading, castVote, cancelVote, error: votingError, lastVoteCancelled } = useVoting();
  const { user } = useAuth();
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [voteCancelled, setVoteCancelled] = useState(false);
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
    } else if (lastVoteCancelled !== null && !voteCancelled) {
      console.log("VOTE WAS CANCELLED", { lastVoteCancelled });
      setVoteSubmitted(false);
      setVoteCancelled(true);
      showNotification("Your vote has been cancelled. You can vote again immediately.", "info");
    }
  }, [userVote, lastVoteCancelled, voteCancelled]);
  
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

  const handleCancelVote = async () => {
    console.log("HANDLE CANCEL VOTE CALLED", { user, userVote });
    
    if (!user || !userVote) {
      console.error("CANCEL VOTE ERROR: Missing user or vote", { 
        hasUser: !!user, 
        hasVote: !!userVote 
      });
      setError("You don't have an active vote to cancel.");
      showNotification("You don't have an active vote to cancel.", "error");
      return;
    }
    
    setError(null);
    showNotification("Cancelling your vote...", "info");
    
    try {
      console.log("CALLING cancelVote FROM VotingContext");
      const result = await cancelVote();
      console.log("CANCEL VOTE RESULT", result);
      
      if (result.success) {
        console.log("VOTE CANCELLATION SUCCESSFUL");
        setVoteCancelled(true);
        setVoteSubmitted(false);
        showNotification("Your vote has been cancelled. You can vote again immediately.", "info");
        console.log("Vote cancelled successfully!");
      } else {
        console.error("VOTE CANCELLATION FAILED", result.error);
        throw new Error(result.error || "Failed to cancel vote");
      }
    } catch (err: any) {
      console.error("ERROR in handleCancelVote", err);
      setError(err.message || "Failed to cancel your vote. Please try again.");
      showNotification(err.message || "Failed to cancel your vote. Please try again.", "error");
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
      <Banner 
        title="MIDNIGHTREBELS &FRIENDS"
        subtitle="DJ COMPETITION - HOLD TO VOTE, TAP VIDEOS TO WATCH"
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
                : <span className="flex items-center"><Music size={16} className="mr-2" /> Hold a DJ card for 1.5s to vote</span>
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
              <p className="mb-2">3. To change your vote, <strong>HOLD</strong> your voted DJ card for 3.5 seconds or use the cancel button.</p>
              <p className="mb-2">4. After cancelling, you can immediately vote for another DJ.</p>
              <p>5. <strong>TAP</strong> on a YouTube thumbnail to watch the DJ's performance video.</p>
            </motion.div>
          )}
          
          {userVote && (
            <div className="border-t border-[#9ACD32]/30 pt-3 mt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelVote}
                className="flex items-center justify-center px-4 py-2 bg-black border border-[#9ACD32] text-[#9ACD32] font-mono text-sm rounded-md hover:bg-[#9ACD32]/10 transition-colors w-full md:w-auto"
              >
                <X size={16} className="mr-2" />
                CANCEL VOTE FOR {candidates.find(c => c.id === userVote.candidate_id)?.name.toUpperCase()}
              </motion.button>
              <p className="text-xs text-[#9ACD32]/50 mt-2 font-mono">
                OR HOLD YOUR VOTED DJ CARD FOR 3.5 SECONDS
              </p>
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
                  voteCount={voteCounts[candidate.id] || 0}
                  totalVotes={totalVotes}
                  hasVoted={!!userVote}
                  userVoted={userVote?.candidate_id === candidate.id}
                  onVote={handleVote}
                  onCancelVote={userVote?.candidate_id === candidate.id ? handleCancelVote : undefined}
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