import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Disc, XCircle, Youtube, Play, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../lib/logger';

interface VoteCardProps {
  id: number;
  name: string;
  genre: string;
  image?: string | null;
  youtube_url?: string | null;
  instagram_username?: string | null;
  voteCount?: number;
  totalVotes?: number;
  hasVoted: boolean;
  userVoted?: boolean;
  onVote?: (id: number) => void;
  aiScore?: number;
}

// Helper function to get YouTube thumbnail URL from video URL
const getYouTubeThumbnail = (youtubeUrl: string | null): string | null => {
  if (!youtubeUrl) return null;
  
  try {
    const videoId = getYouTubeVideoId(youtubeUrl);
    if (!videoId) return null;
    
    // Return high quality thumbnail
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch (error) {
    console.error('Error getting YouTube thumbnail:', error);
    return null;
  }
};

// Extract YouTube video ID from URL
const getYouTubeVideoId = (youtubeUrl: string | null): string | null => {
  if (!youtubeUrl) return null;
  
  try {
    const url = new URL(youtubeUrl);
    
    // Handle youtu.be format
    if (url.hostname === 'youtu.be') {
      return url.pathname.substring(1);
    }
    
    // Handle youtube.com format
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v');
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
};

const VoteCard: React.FC<VoteCardProps> = ({
  id,
  name,
  genre,
  image,
  youtube_url,
  instagram_username,
  voteCount = 0,
  totalVotes = 0,
  hasVoted,
  userVoted = false,
  onVote,
  aiScore = 85
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [voteProgress, setVoteProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const progressIntervalRef = useRef<number | null>(null);
  const voteTriggeredRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const touchThreshold = 300; // 300ms threshold to differentiate tap vs hold
  const minHoldTime = 3500; // 3.5 seconds minimum hold time for voting
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
      
      logger.debug(`Interaction canceled for ${name}`, { 
        component: 'VoteCard',
        data: { candidateId: id } 
      });
    }
  };
  
  const handleVideoThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering vote action
    // Cancel any ongoing voting actions
    cancelVoting();
    if (youtube_url && thumbnailUrl) {
      setShowVideoModal(true);
    }
  };
  
  // Handle touch events (for mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Check if touch is on the video thumbnail
    if ((e.target as HTMLElement).closest('.video-thumbnail')) {
      // Don't prevent default for video thumbnail to allow click/tap
      return;
    }
    
    e.preventDefault(); // Prevent default to avoid scrolling issues
    
    touchStartTimeRef.current = Date.now();
    
    if (!hasVoted && !onVote) return;
    
    if (!hasVoted && onVote && !voteTriggeredRef.current) {
      logger.debug('Touch start detected for voting', { component: 'VoteCard' });
      startVotingProgress();
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Check if touch is on the video thumbnail
    if ((e.target as HTMLElement).closest('.video-thumbnail')) {
      // On touch end for video thumbnail
      const touchDuration = Date.now() - touchStartTimeRef.current;
      // Only open video modal if it was a short touch (tap)
      if (touchDuration < touchThreshold && thumbnailUrl) {
        setShowVideoModal(true);
      }
      return;
    }
    
    e.preventDefault();
    
    // Calculate how long the user held
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    if (!hasVoted && touchDuration >= minHoldTime && !voteTriggeredRef.current) {
      // Complete the vote if user held long enough
      completeVoting();
    } else {
      // Cancel action if released too early
      cancelVoting();
    }
  };
  
  // Handle mouse events (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't process if clicking on the video thumbnail
    if ((e.target as HTMLElement).closest('.video-thumbnail')) {
      return;
    }
    
    e.preventDefault(); // Prevent text selection
    
    touchStartTimeRef.current = Date.now();
    
    if (!hasVoted && !onVote) return;
    
    if (!hasVoted && onVote && !voteTriggeredRef.current) {
      logger.debug('Mouse down detected for voting', { component: 'VoteCard' });
      startVotingProgress();
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    // Don't process if clicking on the video thumbnail
    if ((e.target as HTMLElement).closest('.video-thumbnail')) {
      return;
    }
    
    e.preventDefault();
    
    // Calculate how long the user held
    const clickDuration = Date.now() - touchStartTimeRef.current;
    
    if (!hasVoted && clickDuration >= minHoldTime && !voteTriggeredRef.current) {
      // Complete the vote if user held long enough
      completeVoting();
    } else {
      // Cancel action if released too early
      cancelVoting();
    }
  };

  // Get AI Score display color
  const getAIScoreColor = () => {
    if (aiScore >= 90) return 'text-green-400'; // Excellent score
    if (aiScore >= 85) return 'text-blue-400'; // Great score
    if (aiScore >= 80) return 'text-teal-400'; // Good score
    return 'text-yellow-400'; // Fair score
  };

  // Get AI Score progress bar color
  const getAIScoreProgressColor = () => {
    if (aiScore >= 90) return 'bg-green-500'; // Excellent score
    if (aiScore >= 85) return 'bg-blue-500'; // Great score
    if (aiScore >= 80) return 'bg-teal-500'; // Good score
    return 'bg-yellow-500'; // Fair score
  };

  // Get AI Score label text
  const getAIScoreLabel = () => {
    if (aiScore >= 90) return 'EXCELLENT';
    if (aiScore >= 85) return 'GREAT'; 
    if (aiScore >= 80) return 'GOOD';
    return 'FAIR';
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
      <div className="p-3">
        <h3 className="text-white font-mono text-lg font-bold mb-1">{name}</h3>
        <div className="text-gray-400 text-sm mb-4">{genre}</div>
        
        {/* AI Score with Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <ShieldCheck size={14} className="text-white mr-1" />
              <span className="text-xs text-white">AI SCORE:</span>
            </div>
            <span className={`font-mono text-sm font-bold ${getAIScoreColor()}`}>
              {aiScore}% <span className="text-[10px] opacity-70">({getAIScoreLabel()})</span>
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#9ACD32]/10 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getAIScoreProgressColor()} transition-all duration-500 ease-out`}
              style={{ width: `${aiScore}%` }}
            />
          </div>
        </div>
        
        <div 
          className="video-thumbnail w-full h-48 bg-black border border-[#9ACD32]/30 flex items-center justify-center mb-4 relative overflow-hidden"
          onClick={youtube_url ? handleVideoThumbnailClick : undefined}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
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
      {isVoting && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="mb-4 font-mono text-[#9ACD32] text-lg font-bold">
              {voteProgress < 100 ? 'HOLD TO VOTE' : 'VOTE CONFIRMED'}
            </div>
            {/* Enhanced vote percentage display */}
            <div className="font-mono text-sm text-[#9ACD32] mb-3">
              UPLOADING VOTE: {voteProgress.toFixed(0)}%
            </div>
            {/* Enhanced progress bar with glow effect */}
            <div className="w-48 h-3 bg-[#9ACD32]/20 rounded-full mx-auto mb-4 overflow-hidden border border-[#9ACD32]/40">
              <div 
                className="h-full bg-gradient-to-r from-[#9ACD32]/70 to-[#9ACD32] rounded-full shadow-[0_0_10px_rgba(154,205,50,0.5)]" 
                style={{ width: `${voteProgress}%` }}
              />
            </div>
            {/* Cancel instruction */}
            {voteProgress < 100 && (
              <div className="text-xs text-[#9ACD32]/70 border border-[#9ACD32]/30 px-3 py-1.5 rounded-sm animate-pulse inline-block">
                RELEASE TO CANCEL VOTE
              </div>
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
              className="text-center p-6 bg-black/80 rounded-md border border-[#9ACD32] shadow-[0_0_20px_rgba(154,205,50,0.3)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="font-mono text-[#9ACD32] text-xl mb-2 font-bold"
              >
                VOTE CONFIRMED
              </motion.div>
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-300 text-sm"
              >
                Thank you for your vote!
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* YouTube Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              ref={videoModalRef}
              className="w-full max-w-3xl mx-4 bg-black border border-[#9ACD32] rounded-md overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="p-2 flex justify-between items-center border-b border-[#9ACD32]/30">
                <div className="text-[#9ACD32] font-mono text-sm flex items-center">
                  <Youtube size={14} className="mr-2" />
                  <span>{name} - DJ VIDEO</span>
                </div>
                <button 
                  onClick={() => setShowVideoModal(false)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVideoModal(false);
                  }}
                  className="text-[#9ACD32]/70 hover:text-[#9ACD32] transition-colors p-3 touch-manipulation relative"
                  aria-label="Close video"
                >
                  {/* Invisible larger touch area */}
                  <span className="absolute inset-0"></span>
                  <X size={20} />
                </button>
              </div>
              
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
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