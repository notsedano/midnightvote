import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [votingEnded, setVotingEnded] = useState<boolean | null>(null);
  const [checkingVotingStatus, setCheckingVotingStatus] = useState<boolean>(true);
  
  // Check if voting has ended
  useEffect(() => {
    const checkVotingEnded = async () => {
      setCheckingVotingStatus(true);
      // First check localStorage
      const value = localStorage.getItem('voting_ended');
      if (value === 'true') {
        setVotingEnded(true);
        setCheckingVotingStatus(false);
        return;
      }
      
      // Then check database
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'voting_ended')
          .single();
          
        if (data?.value === 'true') {
          setVotingEnded(true);
          localStorage.setItem('voting_ended', 'true');
        } else {
          setVotingEnded(false);
        }
      } catch (err) {
        console.error('Error checking if voting has ended:', err);
        setVotingEnded(false);
      } finally {
        setCheckingVotingStatus(false);
      }
    };
    
    checkVotingEnded();
  }, []);

  if (isLoading || checkingVotingStatus) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If voting has ended and trying to access /vote, redirect to /results
  if (votingEnded && window.location.pathname === '/vote') {
    return <Navigate to="/results" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;