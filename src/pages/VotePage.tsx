import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import VoteCard from '../components/VoteCard';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import VoteNotification from '../components/VoteNotification';
import { motion } from 'framer-motion';
import { Music, Info, Headphones, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';

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
    if (userVote) {
      setVoteSubmitted(true);
      showNotification("Your vote has been recorded successfully!", "success");
      setVoteCancelled(false);
    } else if (lastVoteCancelled !== null && !voteCancelled) {
      setVoteSubmitted(false);
      setVoteCancelled(true);
      showNotification("Your vote has been cancelled. You can vote again after 5 minutes.", "info");
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
    if (!user || !userVote) {
      setError("You don't have an active vote to cancel.");
      showNotification("You don't have an active vote to cancel.", "error");
      return;
    }
    
    setError(null);
    showNotification("Cancelling your vote...", "info");
    
    try {
      const result = await cancelVote();
      
      if (result.success) {
        setVoteCancelled(true);
        setVoteSubmitted(false);
        showNotification("Your vote has been cancelled. You can vote again after 5 minutes.", "info");
        console.log("Vote cancelled successfully!");
      } else {
        throw new Error(result.error || "Failed to cancel vote");
      }
    } catch (err: any) {
      console.error("Error cancelling vote:", err);
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
        title="DJ VOTING SYSTEM"
        subtitle="CAST YOUR VOTE"
      />
      
      <div className="container mx-auto px-4 relative">
        {/* Instructions Panel */}
        <div className="border border-[#9ACD32] bg-black p-3 mb-6">
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
              className="border border-[#9ACD32]/30 p-3 mb-3 text-xs text-[#9ACD32]/90 font-mono"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="mb-2">1. <strong>PRESS AND HOLD</strong> on a DJ card for 1.5 seconds to cast your vote.</p>
              <p className="mb-2">2. You can vote for <strong>ONLY ONE DJ</strong> in the competition.</p>
              <p className="mb-2">3. To change your vote, <strong>HOLD</strong> your voted DJ card for 3.5 seconds.</p>
              <p>4. After cancelling, there's a <strong>5-MINUTE COOLDOWN</strong> before voting again.</p>
            </motion.div>
          )}
          
          {userVote && (
            <div className="border-t border-[#9ACD32]/30 pt-3 mt-2">
              <Button
                variant="secondary"
                onClick={handleCancelVote}
                className="w-full md:w-auto"
              >
                Cancel My Vote
              </Button>
              <p className="text-xs text-[#9ACD32]/50 mt-2">
                Or long-press your voted DJ card for 3.5 seconds
              </p>
            </div>
          )}
        </div>
        
        {/* DJ Cards Grid */}
        {candidates.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
          <div className="border border-[#9ACD32] bg-black p-6 text-center">
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