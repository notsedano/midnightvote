import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import VoteCard from '../components/VoteCard';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { supabase } from '../lib/supabase';

const VotePage: React.FC = () => {
  const { candidates, voteCounts, totalVotes, userVote, isLoading, castVote, error: votingError } = useVoting();
  const { user } = useAuth();
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Reset vote submitted state when userVote changes
  useEffect(() => {
    if (userVote) {
      setVoteSubmitted(true);
      setStatusMessage("Your vote has been recorded successfully!");
      
      // Clear status message after a delay
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [userVote]);
  
  // Display voting errors
  useEffect(() => {
    if (votingError) {
      setError(votingError);
    }
  }, [votingError]);

  const handleVote = async (candidateId: number) => {
    // Check if user is logged in
    if (!user) {
      setError("You must be logged in to vote.");
      return;
    }
    
    // Check if user has already voted
    if (userVote) {
      setError("You have already voted.");
      return;
    }
    
    setError(null);
    setStatusMessage("Submitting your vote...");
    
    try {
      console.log("Attempting to cast vote for candidate:", candidateId);
      const result = await castVote(candidateId);
      
      if (result.success) {
        setVoteSubmitted(true);
        setStatusMessage("Your vote has been recorded successfully!");
        console.log("Vote successful!");
      } else {
        throw new Error(result.error || "Failed to cast vote");
      }
    } catch (err: any) {
      console.error("Error casting vote:", err);
      setError(err.message || "Failed to cast your vote. Please try again.");
      setStatusMessage(null);
    }
  };

  // Add admin fix function
  const fixAdmin = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);
      
      if (error) throw error;
      
      alert('Admin access granted! Sign out and sign back in, then go to /admin');
    } catch (err) {
      console.error('Error setting admin:', err);
      alert('Error setting admin privileges. See console for details.');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <Banner 
        imageUrl="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800"
        title="Vote for your favorite DJ"
      />
      
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <p className="text-center font-mono text-gray-300">
            {userVote 
              ? "Thanks for voting! You can still browse the candidates."
              : "Press and hold on a DJ card to cast your vote."}
          </p>
          
          {error && (
            <div className="mt-4 mx-auto max-w-md bg-error-900/30 border border-error-700 rounded-md p-3 text-center text-error-300 text-sm">
              {error}
            </div>
          )}
          
          {statusMessage && !error && (
            <div className="mt-4 mx-auto max-w-md bg-primary-900/30 border border-primary-700 rounded-md p-3 text-center text-primary-300 text-sm">
              {statusMessage}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {candidates.map((candidate) => (
            <VoteCard
              key={candidate.id}
              id={candidate.id}
              name={candidate.name}
              genre={candidate.genre}
              image={candidate.image_url}
              voteCount={voteCounts[candidate.id] || 0}
              totalVotes={totalVotes}
              hasVoted={!!userVote}
              userVoted={userVote?.candidate_id === candidate.id}
              onVote={handleVote}
            />
          ))}
        </div>
        
        {candidates.length === 0 && (
          <div className="text-center p-8">
            <p className="text-gray-400">No candidates available yet. Check back soon!</p>
          </div>
        )}
      </div>
      
      {/* Add temporary admin fix button */}
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={fixAdmin}
          className="bg-black text-white text-xs p-2 rounded-md opacity-50 hover:opacity-100"
        >
          Fix Admin
        </button>
      </div>
      
      <Navigation />
    </div>
  );
};

export default VotePage;