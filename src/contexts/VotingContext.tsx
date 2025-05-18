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
  youtube_url: string | null;
  vote_count?: number;
};

type Vote = {
  id: number;
  user_id: string;
  candidate_id: number;
  created_at: string;
  transaction_id: string;
  ip_address?: string;
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
  updateCandidate: (id: number, data: Partial<Candidate>) => Promise<{ success: boolean; error?: string }>;
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
  updateCandidate: async () => ({ success: false }),
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
    console.log("FETCH VOTES CALLED");
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Fetching votes', { component: 'VotingContext' });
      
      // We'll fetch votes in batches to overcome the 1000 default limit
      let allVotes: Vote[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMoreData = true;
      
      while (hasMoreData) {
        console.log(`Fetching votes batch ${page + 1}...`);
        
        const { data, error, count } = await supabase
          .from('votes')
          .select('*', { count: 'exact' })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) {
          console.error(`ERROR FETCHING VOTES BATCH ${page + 1}`, error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allVotes = [...allVotes, ...data];
          console.log(`Batch ${page + 1} returned ${data.length} votes`);
          page++;
          
          // Check if we've received fewer records than the page size
          if (data.length < pageSize) {
            hasMoreData = false;
          }
        } else {
          hasMoreData = false;
        }
      }
      
      console.log("VOTES FETCHED", { 
        count: allVotes.length, 
        batches: page
      });
      
      logger.info('Votes fetched successfully', { 
        component: 'VotingContext',
        data: { count: allVotes.length }
      });
      
      setVotes(allVotes);
      
      // Calculate vote counts
      const counts: Record<number, number> = {};
      let total = 0;
      
      allVotes.forEach(vote => {
        counts[vote.candidate_id] = (counts[vote.candidate_id] || 0) + 1;
        total++;
      });
      
      console.log("VOTE COUNTS CALCULATED", { counts, total });
      
      setVoteCounts(counts);
      setTotalVotes(total);
      
      // Check if user's vote is still in the list after refresh
      if (user) {
        const userVoteAfterRefresh = allVotes.find(v => v.user_id === user.id);
        console.log("USER VOTE AFTER REFRESH", { 
          userId: user.id,
          hasVote: !!userVoteAfterRefresh,
          voteDetails: userVoteAfterRefresh
        });
      }
      
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
      
      // Get the user's IP from localStorage if available (saved during login)
      let userIp = localStorage.getItem('user_ip') || '';
      
      // Insert vote with IP address
      logger.debug('Inserting vote record', { 
        component: 'VotingContext',
        data: { userId: user.id, candidateId, transactionId, ip: userIp }
      });
      
      const { error: voteError, data: voteData } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          candidate_id: candidateId,
          transaction_id: transactionId,
          ip_address: userIp
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

  // Modify the cancelVote function to remove the cooldown check and timeout
  const cancelVote = async () => {
    console.log("CANCEL VOTE FUNCTION CALLED", { user, userVote });
    
    if (!user) {
      const errorMsg = 'You must be logged in to cancel a vote';
      console.error("CANCEL VOTE ERROR: No user logged in");
      logger.warn(errorMsg, { component: 'VotingContext' });
      return { success: false, error: errorMsg };
    }

    if (!userVote) {
      const errorMsg = 'You have not voted yet';
      console.error("CANCEL VOTE ERROR: No active vote found", { userId: user?.id });
      logger.warn(errorMsg, { component: 'VotingContext' });
      return { success: false, error: errorMsg };
    }

    try {
      console.log("STARTING VOTE CANCELLATION", { 
        userVoteId: userVote.id,
        candidateId: userVote.candidate_id,
        userId: user.id
      });
      
      setIsLoading(true);
      setError(null);

      logger.info('Cancelling vote', { 
        component: 'VotingContext',
        data: { userId: user.id, voteId: userVote.id, candidateId: userVote.candidate_id }
      });

      // Store the candidate ID before deleting the vote
      const cancelledCandidateId = userVote.candidate_id;
      
      // Delete the vote
      console.log("DELETING VOTE FROM DATABASE", { voteId: userVote.id });
      const { error: deleteError, data: deleteData } = await supabase
        .from('votes')
        .delete()
        .eq('id', userVote.id)
        .select();
        
      console.log("DELETE VOTE RESPONSE", { deleteError, deleteData });
      
      if (deleteError) {
        console.error("ERROR DELETING VOTE", deleteError);
        logger.error('Error deleting vote', { 
          component: 'VotingContext',
          data: deleteError
        });
        throw deleteError;
      }
      
      // Update profile has_voted status
      console.log("UPDATING PROFILE has_voted STATUS", { userId: user.id });
      const { error: profileError, data: profileData } = await supabase
        .from('profiles')
        .update({ has_voted: false })
        .eq('id', user.id)
        .select();
        
      console.log("UPDATE PROFILE RESPONSE", { profileError, profileData });
      
      if (profileError) {
        console.error("ERROR UPDATING PROFILE", profileError);
        logger.error('Error updating profile after vote cancellation', { 
          component: 'VotingContext',
          data: profileError
        });
        console.error('Error updating profile has_voted status:', profileError);
      }
      
      // Set the last cancelled candidate ID but remove the cooldown
      console.log("SETTING lastVoteCancelled", cancelledCandidateId);
      setLastVoteCancelled(cancelledCandidateId);
      
      // Refresh votes to get the latest state
      console.log("REFRESHING VOTES");
      await fetchVotes();
      
      console.log("VOTE CANCELLATION COMPLETE", { success: true });
      logger.info('Vote cancelled successfully', { 
        component: 'VotingContext',
        data: { userId: user.id, voteId: userVote.id }
      });
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cancel vote';
      console.error("CANCEL VOTE EXCEPTION", err);
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

  const updateCandidate = async (id: number, data: Partial<Candidate>) => {
    if (!user) {
      const errorMsg = 'You must be logged in to update a candidate';
      logger.warn(errorMsg, { component: 'VotingContext' });
      return { success: false, error: errorMsg };
    }

    try {
      setIsLoading(true);
      setError(null);

      logger.info('Updating candidate', { 
        component: 'VotingContext',
        data: { candidateId: id, updateData: data }
      });
      
      const { error } = await supabase
        .from('candidates')
        .update(data)
        .eq('id', id);
        
      if (error) throw error;
      
      logger.info('Candidate updated successfully', { 
        component: 'VotingContext',
        data: { candidateId: id }
      });
      
      // Refresh candidate data
      await fetchCandidates();
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update candidate';
      setError(errorMessage);
      logger.error('Error updating candidate', { 
        component: 'VotingContext', 
        data: err 
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VotingContext.Provider
      value={{
        candidates,
        votes,
        userVote,
        isLoading,
        error,
        fetchCandidates,
        fetchVotes,
        castVote,
        cancelVote,
        updateCandidate,
        voteCounts,
        totalVotes,
        lastVoteCancelled,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};

export const useVoting = () => useContext(VotingContext);