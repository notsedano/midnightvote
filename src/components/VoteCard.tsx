import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Disc, XCircle, Youtube, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../lib/logger';

interface VoteCardProps {
  id: number;
  name: string;
  genre: string;
  image?: string | null;
  youtube_url?: string | null;
  voteCount?: number;
  totalVotes?: number;
  hasVoted: boolean;
  userVoted?: boolean;
  onVote?: (id: number) => void;
  onCancelVote?: () => void;
}

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

const VoteCard: React.FC<VoteCardProps> = ({
  id,
  name,
  genre,
  image,
  youtube_url,
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
  const [showVideoModal, setShowVideoModal] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);
  const voteTriggeredRef = useRef(false);
  const cancelTriggeredRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const touchThreshold = 300; // 300ms threshold to differentiate tap vs hold
  const minHoldTime = 1500; // 1.5 seconds minimum hold time for voting
  const minCancelHoldTime = 3500; // 3.5 seconds minimum hold time for cancelling
  const videoModalRef = useRef<HTMLDivElement>(null);
  
  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
  
  // Get thumbnail URL
  const thumbnailUrl = getYouTubeThumbnail(youtube_url || null);
  const videoId = getYouTubeVideoId(youtube_url || null);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (videoModalRef.current && !videoModalRef.current.contains(event.target as Node)) {
        setShowVideoModal(false);
      }
    };

    if (showVideoModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVideoModal]);
  
  // Listen for ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowVideoModal(false);
      }
    };

    if (showVideoModal) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showVideoModal]);
  
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
    console.log("VOTE CARD: completeCancellation called", {
      candidateId: id,
      candidateName: name,
      hasCancelHandler: !!onCancelVote
    });
    
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (cancelTriggeredRef.current) {
      console.log("VOTE CARD: Cancellation already triggered, ignoring");
      return; // Prevent duplicate cancellations
    }
    
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
      console.log("VOTE CARD: Calling onCancelVote handler");
      onCancelVote();
    } else {
      console.error("VOTE CARD: No onCancelVote handler provided");
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
  
  const handleVideoThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering vote action
    if (youtube_url && thumbnailUrl) {
      setShowVideoModal(true);
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
    
    // Check if it was a tap (short duration) on video thumbnail
    if (thumbnailUrl && touchDuration < touchThreshold) {
      // Get the target element
      const target = e.target as HTMLElement;
      // Check if the tap was on the video thumbnail container
      if (target.closest('.video-thumbnail')) {
        setShowVideoModal(true);
        return;
      }
    }
    
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
    // Don't prevent default if clicking on the video thumbnail
    if (!(e.target as HTMLElement).closest('.video-thumbnail')) {
      e.preventDefault(); // Prevent text selection
    }
    
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
    // Don't prevent default if clicking on the video thumbnail
    if (!(e.target as HTMLElement).closest('.video-thumbnail')) {
      e.preventDefault();
    }
    
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
      className={`relative border border-[#9ACD32]/30 bg-black rounded-md overflow-hidden ${hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
      whileHover={{ scale: 1.01 }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={cancelVoting}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-[#9ACD32]/30">
        <div className="font-mono text-[#9ACD32] flex items-center">
          <Terminal size={14} className="mr-1" />
          <span className="text-sm">DJ.{id < 10 ? '0' : ''}{id}</span>
        </div>
        <div className="font-mono text-[#9ACD32] text-xs flex items-center">
          <span>VOTES: {voteCount}</span>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4">
        <h2 className="text-[#9ACD32] font-mono text-lg mb-1">{name}</h2>
        
        <div className="inline-block px-2 py-1 bg-black border border-[#9ACD32]/50 text-[#9ACD32] text-xs rounded-sm mb-4">
          {genre || "EDM/HOUSE"}
        </div>
        
        {/* Video thumbnail */}
        <div 
          className="video-thumbnail w-full h-48 bg-black border border-[#9ACD32]/30 flex items-center justify-center mb-4 relative overflow-hidden"
          onClick={youtube_url ? handleVideoThumbnailClick : undefined}
        >
          {thumbnailUrl ? (
            <div className="w-full h-full relative cursor-pointer group">
              <img 
                src={thumbnailUrl} 
                alt={`${name} thumbnail`}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/50 border-2 border-[#9ACD32] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Play size={18} className="text-[#9ACD32] ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2">
                <Youtube size={16} className="text-[#9ACD32]" />
              </div>
            </div>
          ) : (
            <Disc size={32} className="text-[#9ACD32] opacity-30" />
          )}
        </div>
        
        {/* Voting progress bar */}
        <div className="mb-2 h-1 w-full bg-[#9ACD32]/10 relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-[#9ACD32]"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-[#9ACD32] font-mono">
          <span>VOTE PERCENTAGE</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      </div>
      
      {/* Interaction overlays */}
      {(isVoting || isCancelling) && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center">
            {isVoting && (
              <>
                <div className="mb-4 font-mono text-[#9ACD32]">
                  {voteProgress < 100 ? 'HOLD TO VOTE' : 'VOTE CONFIRMED'}
                </div>
                <div className="w-32 h-2 bg-[#9ACD32]/20 rounded-full mx-auto mb-2">
                  <div 
                    className="h-full bg-[#9ACD32] rounded-full" 
                    style={{ width: `${voteProgress}%` }}
                  />
                </div>
              </>
            )}
            
            {isCancelling && (
              <>
                <div className="mb-4 font-mono text-red-500">
                  {cancelProgress < 100 ? 'HOLD TO CANCEL VOTE' : 'VOTE CANCELLED'}
                </div>
                <div className="w-32 h-2 bg-red-900/20 rounded-full mx-auto mb-2">
                  <div 
                    className="h-full bg-red-500 rounded-full" 
                    style={{ width: `${cancelProgress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Confirmation animation */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div 
            className="absolute inset-0 bg-[#9ACD32]/20 backdrop-blur-sm flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="text-center p-4 bg-black/80 rounded-md border border-[#9ACD32]"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="font-mono text-[#9ACD32] text-lg mb-2">VOTE CONFIRMED</div>
              <div className="text-gray-400 text-sm">Thank you for your vote!</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cancellation animation */}
      <AnimatePresence>
        {showCancellation && (
          <motion.div 
            className="absolute inset-0 bg-red-900/20 backdrop-blur-sm flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="text-center p-4 bg-black/80 rounded-md border border-red-500"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="font-mono text-red-500 text-lg mb-2">VOTE REMOVED</div>
              <div className="text-gray-400 text-sm">Your vote has been cancelled.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* YouTube Video Modal */}
      <AnimatePresence>
        {showVideoModal && videoId && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div 
              ref={videoModalRef}
              className="bg-black border border-[#9ACD32] rounded-md w-full max-w-3xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 flex justify-between items-center border-b border-[#9ACD32]/30">
                <div className="text-[#9ACD32] font-mono text-sm flex items-center">
                  <Youtube size={14} className="mr-2" />
                  <span>{name} - DJ VIDEO</span>
                </div>
                <button 
                  onClick={() => setShowVideoModal(false)}
                  className="text-[#9ACD32]/70 hover:text-[#9ACD32] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {userVoted && (
        <div className="absolute top-2 right-2 text-[#9ACD32]">
          <div className="w-3 h-3 rounded-full bg-[#9ACD32] animate-pulse" />
        </div>
      )}
    </motion.div>
  );
};

export default VoteCard;