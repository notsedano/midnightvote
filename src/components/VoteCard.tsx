import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Disc, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../lib/logger';

interface VoteCardProps {
  id: number;
  name: string;
  genre: string;
  image?: string | null;
  voteCount?: number;
  totalVotes?: number;
  hasVoted: boolean;
  userVoted?: boolean;
  onVote?: (id: number) => void;
  onCancelVote?: () => void;
}

const VoteCard: React.FC<VoteCardProps> = ({
  id,
  name,
  genre,
  image,
  voteCount = 0,
  totalVotes = 0,
  hasVoted,
  userVoted = false,
  onVote,
  onCancelVote,
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [voteProgress, setVoteProgress] = useState(0);
  const [cancelProgress, setCancelProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);
  const voteTriggeredRef = useRef(false);
  const cancelTriggeredRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const minHoldTime = 1500; // 1.5 seconds minimum hold time for voting
  const minCancelHoldTime = 3500; // 3.5 seconds minimum hold time for cancelling
  
  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
  
  // Log voting interaction
  useEffect(() => {
    if (isVoting) {
      logger.debug(`Vote interaction started for ${name}`, { 
        component: 'VoteCard',
        data: { candidateId: id } 
      });
    }
  }, [isVoting, id, name]);

  // Log cancellation interaction
  useEffect(() => {
    if (isCancelling) {
      logger.debug(`Vote cancellation started for ${name}`, { 
        component: 'VoteCard',
        data: { candidateId: id } 
      });
    }
  }, [isCancelling, id, name]);
  
  // Clean up intervals when unmounting
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);
  
  const startVotingProgress = () => {
    // Cancel any existing interval
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setVoteProgress(0);
    setIsVoting(true);
    voteTriggeredRef.current = false;
    
    // Start progress interval - 100% over 1.5 seconds
    let progress = 0;
    const incrementAmount = 2; // 2% increment
    const intervalTime = minHoldTime / (100 / incrementAmount); // time between increments
    
    progressIntervalRef.current = window.setInterval(() => {
      progress += incrementAmount;
      setVoteProgress(Math.min(progress, 100));
      
      if (progress >= 100) {
        completeVoting();
      }
    }, intervalTime);
  };

  const startCancelProgress = () => {
    // Cancel any existing interval
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setCancelProgress(0);
    setIsCancelling(true);
    cancelTriggeredRef.current = false;
    
    // Start progress interval - 100% over 3.5 seconds
    let progress = 0;
    const incrementAmount = 1; // 1% increment
    const intervalTime = minCancelHoldTime / (100 / incrementAmount); // time between increments
    
    progressIntervalRef.current = window.setInterval(() => {
      progress += incrementAmount;
      setCancelProgress(Math.min(progress, 100));
      
      if (progress >= 100) {
        completeCancellation();
      }
    }, intervalTime);
  };
  
  const completeVoting = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (voteTriggeredRef.current) return; // Prevent duplicate votes
    
    setIsVoting(false);
    setVoteProgress(100);
    setShowConfirmation(true);
    voteTriggeredRef.current = true;
    
    logger.info(`Vote completed for ${name}`, { 
      component: 'VoteCard', 
      data: { candidateId: id }
    });
    
    // Call the vote handler
    if (onVote) {
      onVote(id);
    }
    
    // Hide confirmation after a delay
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };

  const completeCancellation = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (cancelTriggeredRef.current) return; // Prevent duplicate cancellations
    
    setIsCancelling(false);
    setCancelProgress(100);
    setShowCancellation(true);
    cancelTriggeredRef.current = true;
    
    logger.info(`Vote cancellation completed for ${name}`, { 
      component: 'VoteCard', 
      data: { candidateId: id }
    });
    
    // Call the cancel vote handler
    if (onCancelVote) {
      onCancelVote();
    }
    
    // Hide cancellation after a delay
    setTimeout(() => {
      setShowCancellation(false);
    }, 3000);
  };
  
  const cancelVoting = () => {
    // Only cancel if voting hasn't completed yet
    if (!voteTriggeredRef.current && !cancelTriggeredRef.current) {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setIsVoting(false);
      setIsCancelling(false);
      setVoteProgress(0);
      setCancelProgress(0);
      
      logger.debug(`Interaction canceled for ${name}`, { 
        component: 'VoteCard',
        data: { candidateId: id } 
      });
    }
  };
  
  // Handle touch events (for mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid scrolling issues
    
    touchStartTimeRef.current = Date.now();
    
    if (!hasVoted && !onVote) return;
    
    if (userVoted && onCancelVote) {
      logger.debug('Touch start detected for vote cancellation', { component: 'VoteCard' });
      startCancelProgress();
    } else if (!hasVoted && onVote && !voteTriggeredRef.current) {
      logger.debug('Touch start detected for voting', { component: 'VoteCard' });
      startVotingProgress();
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // Calculate how long the user held
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    if (userVoted && touchDuration >= minCancelHoldTime && !cancelTriggeredRef.current) {
      // Complete the vote cancellation if user held long enough
      completeCancellation();
    } else if (!hasVoted && touchDuration >= minHoldTime && !voteTriggeredRef.current) {
      // Complete the vote if user held long enough
      completeVoting();
    } else {
      // Cancel action if released too early
      cancelVoting();
    }
  };
  
  // Handle mouse events (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    
    touchStartTimeRef.current = Date.now();
    
    if (!hasVoted && !onVote) return;
    
    if (userVoted && onCancelVote) {
      logger.debug('Mouse down detected for vote cancellation', { component: 'VoteCard' });
      startCancelProgress();
    } else if (!hasVoted && onVote && !voteTriggeredRef.current) {
      logger.debug('Mouse down detected for voting', { component: 'VoteCard' });
      startVotingProgress();
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Calculate how long the user held
    const clickDuration = Date.now() - touchStartTimeRef.current;
    
    if (userVoted && clickDuration >= minCancelHoldTime && !cancelTriggeredRef.current) {
      // Complete the vote cancellation if user held long enough
      completeCancellation();
    } else if (!hasVoted && clickDuration >= minHoldTime && !voteTriggeredRef.current) {
      // Complete the vote if user held long enough
      completeVoting();
    } else {
      // Cancel action if released too early
      cancelVoting();
    }
  };

  return (
    <motion.div 
      className={`relative overflow-hidden cursor-pointer bg-black border ${userVoted ? 'border-[#9ACD32]' : 'border-[#9ACD32]/50'} p-4 font-mono`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -5 }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={cancelVoting}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={cancelVoting}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3 border-b border-[#9ACD32]/30 pb-2">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-[#9ACD32]" />
          <span className="text-[#9ACD32] text-sm font-bold uppercase">DJ.{id}</span>
        </div>
        {hasVoted && <span className="text-xs text-[#9ACD32]/70">VOTES: {voteCount}</span>}
      </div>
      
      {/* Highlight overlay while voting */}
      {isVoting && (
        <motion.div 
          className="absolute inset-0 border-2 border-[#9ACD32] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Highlight overlay while cancelling */}
      {isCancelling && (
        <motion.div 
          className="absolute inset-0 border-2 border-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Main Content */}
      <div className="space-y-3">
        {/* Name and Genre */}
        <div>
          <h3 className="text-lg text-[#9ACD32] mb-1">{name}</h3>
          <div className="inline-block px-2 border border-[#9ACD32]/50 text-xs text-[#9ACD32]/80">
            {genre.toUpperCase()}
          </div>
        </div>
        
        {/* DJ Image or Icon */}
        <div className="flex justify-center items-center h-32 border border-[#9ACD32]/30 bg-black">
          {image ? (
            <img 
              src={image} 
              alt={name} 
              className="h-full object-contain max-h-32 p-1 opacity-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc size={48} className="text-[#9ACD32]/50" />
            </div>
          )}
        </div>
      </div>
      
      {/* Vote Info */}
      {hasVoted ? (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#9ACD32]/70">VOTE PERCENTAGE</span>
            <span className="text-[#9ACD32]">{percentage.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-black border border-[#9ACD32]/30">
            <motion.div 
              className="h-full bg-[#9ACD32]" 
              initial={{ width: '0%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {userVoted && (
            <div className="pt-2 border-t border-[#9ACD32]/30 mt-2">
              <div className="text-center">
                <span className="text-xs text-[#9ACD32]">
                  VOTE STATUS: CONFIRMED
                </span>
              </div>
              
              {isCancelling && (
                <div className="mt-3">
                  <div className="flex justify-between mb-1 text-xs">
                    <span className="text-white">CANCEL PROGRESS</span>
                    <span className="text-white">{cancelProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-black border border-white/30">
                    <motion.div 
                      className="h-full bg-white"
                      style={{ 
                        width: `${cancelProgress}%`,
                        transition: 'width 0.1s linear' 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-2 pt-2 border-t border-[#9ACD32]/30">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#9ACD32]/70">
              {isVoting ? 'HOLD TO VOTE' : 'PRESS AND HOLD TO VOTE'}
            </span>
            {isVoting && (
              <span className="text-[#9ACD32]">{voteProgress}%</span>
            )}
          </div>
          <div className="h-1.5 bg-black border border-[#9ACD32]/30">
            <motion.div 
              className="h-full bg-[#9ACD32]" 
              style={{ 
                width: `${isVoting ? voteProgress : 0}%`,
                transition: isVoting ? 'width 0.1s linear' : 'width 0.3s ease' 
              }}
            />
          </div>
        </div>
      )}
      
      {/* Vote Confirmation */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div 
            className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm border-2 border-[#9ACD32]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center space-y-3">
              <div className="inline-block px-4 py-2 border border-[#9ACD32] bg-black">
                <span className="text-[#9ACD32] text-sm">VOTE CONFIRMED</span>
              </div>
              <p className="text-[#9ACD32]/70 text-xs">
                You voted for {name.toUpperCase()}
              </p>
              <div className="pt-2">
                <span className="text-xs text-[#9ACD32]/50 animate-pulse">
                  // Transaction logged //
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vote Cancellation */}
      <AnimatePresence>
        {showCancellation && (
          <motion.div 
            className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm border-2 border-white"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center space-y-3">
              <div className="inline-block px-4 py-2 border border-white bg-black">
                <span className="text-white text-sm">VOTE CANCELLED</span>
              </div>
              <p className="text-white/70 text-xs">
                Cooldown: 5 minutes
              </p>
              <div className="pt-2">
                <span className="text-xs text-white/50 animate-pulse">
                  // System reset in progress //
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoteCard;