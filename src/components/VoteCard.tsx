import React, { useState, useRef, useEffect } from 'react';
import { Music } from 'lucide-react';
import { motion } from 'framer-motion';
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
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [voteProgress, setVoteProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);
  const voteTriggeredRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const minHoldTime = 1500; // 1.5 seconds minimum hold time for voting
  
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
  
  const cancelVoting = () => {
    // Only cancel if voting hasn't completed yet
    if (!voteTriggeredRef.current) {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setIsVoting(false);
      setVoteProgress(0);
      
      logger.debug(`Vote interaction canceled for ${name}`, { 
        component: 'VoteCard',
        data: { candidateId: id } 
      });
    }
  };
  
  // Handle touch events (for mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default to avoid scrolling issues
    
    if (hasVoted || !onVote || voteTriggeredRef.current) return;
    
    logger.debug('Touch start detected', { component: 'VoteCard' });
    touchStartTimeRef.current = Date.now();
    startVotingProgress();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // Calculate how long the user held
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    if (touchDuration >= minHoldTime && !voteTriggeredRef.current) {
      // Complete the vote if user held long enough
      completeVoting();
    } else {
      // Cancel vote if released too early
      cancelVoting();
    }
  };
  
  // Handle mouse events (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    
    if (hasVoted || !onVote || voteTriggeredRef.current) return;
    
    logger.debug('Mouse down detected', { component: 'VoteCard' });
    touchStartTimeRef.current = Date.now();
    startVotingProgress();
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Calculate how long the user held
    const clickDuration = Date.now() - touchStartTimeRef.current;
    
    if (clickDuration >= minHoldTime && !voteTriggeredRef.current) {
      // Complete the vote if user held long enough
      completeVoting();
    } else {
      // Cancel vote if released too early
      cancelVoting();
    }
  };

  return (
    <motion.div 
      className={`card relative ${hasVoted ? 'cursor-default' : 'cursor-pointer'} ${userVoted ? 'cyber-border' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={!hasVoted ? { scale: 1.02 } : {}}
      onMouseDown={!hasVoted ? handleMouseDown : undefined}
      onMouseUp={!hasVoted ? handleMouseUp : undefined}
      onMouseLeave={!hasVoted ? cancelVoting : undefined}
      onTouchStart={!hasVoted ? handleTouchStart : undefined}
      onTouchEnd={!hasVoted ? handleTouchEnd : undefined}
      onTouchCancel={!hasVoted ? cancelVoting : undefined}
    >
      {/* Highlight overlay while voting */}
      {isVoting && (
        <motion.div 
          className="absolute inset-0 bg-primary-500/10 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Image or Icon */}
      <div className="w-full h-32 bg-dark-900 rounded-md mb-4 overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={48} className="text-primary-400" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="mb-2">
        <h3 className="text-xl font-mono text-primary-400">{name}</h3>
        <p className="text-sm text-gray-400">{genre}</p>
      </div>
      
      {/* Vote Count or Progress */}
      {hasVoted ? (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">Votes: {voteCount}</span>
            <span className="text-xs text-primary-400">{percentage.toFixed(1)}%</span>
          </div>
          <div className="voting-progress">
            <div 
              className="voting-progress-bar" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          {userVoted && (
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 bg-primary-400 text-dark-950 rounded text-xs font-mono">
                You voted for this DJ
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">
                {isVoting ? 'Hold to vote' : 'Press and hold to vote'}
              </span>
              {isVoting && (
                <span className="text-xs text-primary-400">{voteProgress}%</span>
              )}
            </div>
            <div className="voting-progress">
              <div 
                className="voting-progress-bar" 
                style={{ 
                  width: `${isVoting ? voteProgress : 0}%`,
                  transition: isVoting ? 'width 0.1s linear' : 'width 0.3s ease' 
                }}
              ></div>
            </div>
          </div>
        </>
      )}
      
      {/* Vote Confirmation */}
      {showConfirmation && (
        <motion.div 
          className="absolute inset-0 bg-dark-800/90 flex items-center justify-center rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary-400 rounded-full flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-dark-950" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-mono text-primary-400">Vote Recorded!</h3>
            <p className="mt-2 text-sm text-gray-400">
              Your vote for {name} has been registered
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VoteCard;