import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { logger } from '../lib/logger';

type Candidate = {
  id: number;
  name: string;
  genre: string;
  image_url: string | null;
  instagram_username: string | null;
  bio: string | null;
  vote_count?: number;
};

type Vote = {
  id: number;
  user_id: string;
  candidate_id: number;
  created_at: string;
  transaction_id: string;
};

type VotingContextType = {
  candidates: Candidate[];
  votes: Vote[];
  userVote: Vote | null;
  isLoading: boolean;
  error: string | null;
  fetchCandidates: () => Promise<void>;
  fetchVotes: () => Promise<void>;
  castVote: (candidateId: number) => Promise<{ success: boolean; error?: string }>;
  cancelVote: () => Promise<{ success: boolean; error?: string }>;
  voteCounts: Record<number, number>;
  totalVotes: number;
  lastVoteCancelled: number | null;
};

const VotingContext = createContext<VotingContextType>({
  candidates: [],
  votes: [],
  userVote: null,
  isLoading: false,
  error: null,
  fetchCandidates: async () => {},
  fetchVotes: async () => {},
  castVote: async () => ({ success: false }),
  cancelVote: async () => ({ success: false }),
  voteCounts: {},
  totalVotes: 0,
  lastVoteCancelled: null,
});

export const VotingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [lastVoteCancelled, setLastVoteCancelled] = useState<number | null>(null);
  const [voteCooldown, setVoteCooldown] = useState<boolean>(false);

  const { user } = useAuth();

  // Subscribe to candidates
  useEffect(() => {
    fetchCandidates();
    
    const candidatesSubscription = supabase
      .channel('candidates-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'candidates' 
      }, () => {
        fetchCandidates();
      })
      .subscribe();

    logger.info('Subscribed to candidates channel', { component: 'VotingContext' });

    return () => {
      supabase.removeChannel(candidatesSubscription);
      logger.info('Unsubscribed from candidates channel', { component: 'VotingContext' });
    };
  }, []);

  // Subscribe to votes
  useEffect(() => {
    fetchVotes();
    
    const votesSubscription = supabase
      .channel('votes-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'votes' 
      }, () => {
        fetchVotes();
      })
      .subscribe();

    logger.info('Subscribed to votes channel', { component: 'VotingContext' });

    return () => {
      supabase.removeChannel(votesSubscription);
      logger.info('Unsubscribed from votes channel', { component: 'VotingContext' });
    };
  }, []);

  // Get user vote when user changes
  useEffect(() => {
    if (user && votes.length > 0) {
      const vote = votes.find(v => v.user_id === user.id) || null;
      setUserVote(vote);
      logger.info('User vote status updated', { 
        component: 'VotingContext',
        data: { 
          userId: user.id,
          hasVoted: !!vote,
          voteDetails: vote 
        }
      });
    } else {
      setUserVote(null);
    }
  }, [user, votes]);

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Fetching candidates', { component: 'VotingContext' });
      
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      logger.info('Candidates fetched successfully', { 
        component: 'VotingContext',
        data: { count: data?.length || 0 }
      });
      
      setCandidates(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch candidates';
      setError(errorMessage);
      logger.error('Error fetching candidates', { 
        component: 'VotingContext', 
        data: err 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Fetching votes', { component: 'VotingContext' });
      
      const { data, error } = await supabase
        .from('votes')
        .select('*');
      
      if (error) throw error;
      
      logger.info('Votes fetched successfully', { 
        component: 'VotingContext',
        data: { count: data?.length || 0 }
      });
      
      setVotes(data || []);
      
      // Calculate vote counts
      const counts: Record<number, number> = {};
      let total = 0;
      
      data?.forEach(vote => {
        counts[vote.candidate_id] = (counts[vote.candidate_id] || 0) + 1;
        total++;
      });
      
      setVoteCounts(counts);
      setTotalVotes(total);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch votes';
      setError(errorMessage);
      logger.error('Error fetching votes', { 
        component: 'VotingContext', 
        data: err 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTransactionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  const castVote = async (candidateId: number) => {
    if (!user) {
      const errorMsg = 'You must be logged in to vote';
      logger.warn(errorMsg, { component: 'VotingContext' });
      return { success: false, error: errorMsg };
    }

    if (userVote) {
      const errorMsg = 'You have already voted';
      logger.warn(errorMsg, { 
        component: 'VotingContext',
        data: { userId: user.id, existingVote: userVote }
      });
      return { success: false, error: errorMsg };
    }

    try {
      setIsLoading(true);
      setError(null);

      logger.info('Casting vote', { 
        component: 'VotingContext',
        data: { userId: user.id, candidateId }
      });

      const transactionId = generateTransactionId();
      
      // Check if candidate exists
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) {
        throw new Error('Invalid candidate selected');
      }
      
      // Insert vote
      logger.debug('Inserting vote record', { 
        component: 'VotingContext',
        data: { userId: user.id, candidateId, transactionId }
      });
      
      const { error: voteError, data: voteData } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          candidate_id: candidateId,
          transaction_id: transactionId
        })
        .select()
        .single();
        
      if (voteError) {
        logger.error('Error inserting vote', { 
          component: 'VotingContext',
          data: voteError
        });
        throw voteError;
      }
      
      logger.debug('Vote recorded successfully', { 
        component: 'VotingContext',
        data: voteData
      });
      
      // Update profile has_voted status
      logger.debug('Updating profile has_voted status', { 
        component: 'VotingContext',
        data: { userId: user.id }
      });
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_voted: true })
        .eq('id', user.id);
        
      if (profileError) {
        logger.error('Error updating profile', { 
          component: 'VotingContext',
          data: profileError
        });
        // We don't throw here to avoid reverting the vote if only the profile update fails
        console.error('Error updating profile has_voted status:', profileError);
      }
      
      // Refresh votes to get the latest state
      await fetchVotes();
      
      logger.info('Vote cast successfully', { 
        component: 'VotingContext',
        data: { userId: user.id, candidateId, candidateName: candidate.name }
      });
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cast vote';
      setError(errorMessage);
      logger.error('Error casting vote', { 
        component: 'VotingContext', 
        data: { error: err, userId: user?.id, candidateId } 
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Add cancelVote function
  const cancelVote = async () => {
    if (!user) {
      const errorMsg = 'You must be logged in to cancel a vote';
      logger.warn(errorMsg, { component: 'VotingContext' });
      return { success: false, error: errorMsg };
    }

    if (!userVote) {
      const errorMsg = 'You have not voted yet';
      logger.warn(errorMsg, { component: 'VotingContext' });
      return { success: false, error: errorMsg };
    }

    if (voteCooldown) {
      const errorMsg = 'Please wait 5 minutes before voting again';
      logger.warn(errorMsg, { component: 'VotingContext' });
      return { success: false, error: errorMsg };
    }

    try {
      setIsLoading(true);
      setError(null);

      logger.info('Cancelling vote', { 
        component: 'VotingContext',
        data: { userId: user.id, voteId: userVote.id, candidateId: userVote.candidate_id }
      });

      // Store the candidate ID before deleting the vote
      const cancelledCandidateId = userVote.candidate_id;
      
      // Delete the vote
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('id', userVote.id);
        
      if (deleteError) {
        logger.error('Error deleting vote', { 
          component: 'VotingContext',
          data: deleteError
        });
        throw deleteError;
      }
      
      // Update profile has_voted status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_voted: false })
        .eq('id', user.id);
        
      if (profileError) {
        logger.error('Error updating profile after vote cancellation', { 
          component: 'VotingContext',
          data: profileError
        });
        console.error('Error updating profile has_voted status:', profileError);
      }
      
      // Set cooldown
      setVoteCooldown(true);
      setLastVoteCancelled(cancelledCandidateId);
      
      // Reset cooldown after 5 minutes
      setTimeout(() => {
        setVoteCooldown(false);
      }, 5 * 60 * 1000); // 5 minutes in milliseconds
      
      // Refresh votes to get the latest state
      await fetchVotes();
      
      logger.info('Vote cancelled successfully', { 
        component: 'VotingContext',
        data: { userId: user.id, voteId: userVote.id }
      });
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cancel vote';
      setError(errorMessage);
      logger.error('Error cancelling vote', { 
        component: 'VotingContext', 
        data: { error: err, userId: user?.id, voteId: userVote?.id } 
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VotingContext.Provider value={{
      candidates,
      votes,
      userVote,
      isLoading,
      error,
      fetchCandidates,
      fetchVotes,
      castVote,
      cancelVote,
      voteCounts,
      totalVotes,
      lastVoteCancelled,
    }}>
      {children}
    </VotingContext.Provider>
  );
};

export const useVoting = () => useContext(VotingContext);